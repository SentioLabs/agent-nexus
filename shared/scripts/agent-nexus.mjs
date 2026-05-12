#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedModes = new Set(["slop", "size", "both"]);
const allowedVerdicts = new Set(["pass", "fail", "concerns"]);

const schema = {
  type: "object",
  properties: {
    verdict: { type: "string" },
    report_markdown: { type: "string" },
  },
  required: ["verdict", "report_markdown"],
  additionalProperties: true,
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const codeQualityPluginRoot = path.join(repoRoot, "claude-marketplace/plugins/code-quality");

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

function parseArgs(args) {
  const [namespace, command, ...rest] = args;
  if (namespace !== "code-quality" || command !== "review") {
    throw new UsageError(
      "usage: agent-nexus code-quality review --pr-number <number> --mode <slop|size|both> [--size-review-exclude <pattern>]",
    );
  }

  const parsed = { prNumber: null, mode: null, sizeReviewExclude: null };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--pr-number") {
      parsed.prNumber = requireValue(rest, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--mode") {
      parsed.mode = requireValue(rest, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--size-review-exclude") {
      parsed.sizeReviewExclude = requireValue(rest, index, arg);
      index += 1;
      continue;
    }
    throw new UsageError(`unknown argument: ${arg}`);
  }

  const prNumber = Number(parsed.prNumber);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new UsageError("--pr-number must be a positive integer");
  }
  if (!allowedModes.has(parsed.mode)) {
    throw new UsageError("--mode must be one of: slop, size, both");
  }
  if (parsed.sizeReviewExclude !== null) {
    if (parsed.sizeReviewExclude.length === 0) {
      throw new UsageError("--size-review-exclude must not be empty");
    }
    if (/[\u0000-\u001f\u007f]/u.test(parsed.sizeReviewExclude)) {
      throw new UsageError("--size-review-exclude must not contain control characters");
    }
    if (parsed.mode === "slop") {
      throw new UsageError("--size-review-exclude cannot be used with --mode slop");
    }
  }

  return {
    prNumber,
    mode: parsed.mode,
    sizeReviewExclude: parsed.sizeReviewExclude,
  };
}

function requireValue(args, index, flag) {
  const value = args[index + 1];
  if (typeof value !== "string" || value.startsWith("--")) {
    throw new UsageError(`${flag} requires a value`);
  }
  return value;
}

function buildReviewCommands({ prNumber, mode, sizeReviewExclude }) {
  const slopCommand = `/code-quality:slop #${prNumber}`;
  const sizeCommand = [
    `/code-quality:size #${prNumber}`,
    sizeReviewExclude ? `--exclude ${quoteCommandValue(sizeReviewExclude)}` : null,
  ].filter(Boolean).join(" ");

  if (mode === "slop") {
    return slopCommand;
  }
  if (mode === "size") {
    return sizeCommand;
  }
  return `${slopCommand}\n${sizeCommand}`;
}

function quoteCommandValue(value) {
  if (!/\s/u.test(value)) {
    return value;
  }
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function buildReviewPrompt(request) {
  const reviewCommands = buildReviewCommands(request);
  return `Run the existing SentioLabs code-quality review behavior for this pull request.\n\nUse these command invocation(s) as the source of truth:\n\n${reviewCommands}\n\nPreserve the behavior from the bundled Claude code-quality plugin at:\n- ${path.join(codeQualityPluginRoot, "commands/slop.md")}\n- ${path.join(codeQualityPluginRoot, "commands/size.md")}\n- ${path.join(codeQualityPluginRoot, "skills/slop-review/SKILL.md")}\n- ${path.join(codeQualityPluginRoot, "skills/size-review/SKILL.md")}\n\nReturn only a JSON object matching this schema:\n\n${JSON.stringify(schema, null, 2)}\n\nNormalize the top-level verdict to one of pass, fail, or concerns and put the complete GitHub-flavored Markdown review body in report_markdown.`;
}

function normalizeVerdict(verdict) {
  if (typeof verdict !== "string") {
    return "concerns";
  }
  const normalized = verdict.trim().toLowerCase();
  if (allowedVerdicts.has(normalized)) {
    return normalized;
  }
  if (/\b(fail|failure|blocking|pervasive|strong slop|splittable|too large)\b/.test(normalized)) {
    return "fail";
  }
  if (/\b(mild|significant|over threshold|indivisible|concerns? found|has concerns?|with concerns?)\b/.test(normalized)) {
    return "concerns";
  }
  if (
    /\b(clean|appropriately sized|ship-as-is|no blocking|no concerns|passes?)\b/.test(normalized)
  ) {
    return "pass";
  }
  return "concerns";
}

function parseReviewOutput(rawOutput) {
  const parsed = parseJsonObject(rawOutput);
  if (typeof parsed.report_markdown !== "string" || parsed.report_markdown.trim().length === 0) {
    throw new Error("runtime output must be a JSON object with non-empty string report_markdown");
  }

  return {
    verdict: normalizeVerdict(parsed.verdict),
    report_markdown: parsed.report_markdown,
  };
}

function parseJsonObject(rawOutput) {
  if (typeof rawOutput !== "string") {
    return {};
  }
  try {
    const direct = JSON.parse(rawOutput.trim());
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct;
    }
  } catch {
    return {};
  }
  return {};
}

async function defaultRunReview({ prompt }) {
  const runtime = process.env.AGENT_NEXUS_CODE_QUALITY_RUNTIME || detectRuntime();
  if (runtime === "claude") {
    return runProcess("claude", [
      "--print",
      "--plugin-dir",
      codeQualityPluginRoot,
      "--json-schema",
      JSON.stringify(schema),
      prompt,
    ]);
  }
  if (runtime === "codex") {
    return runCodex(prompt);
  }
  throw new Error("No supported agent runtime found. Install claude or codex, or set AGENT_NEXUS_CODE_QUALITY_RUNTIME.");
}

function detectRuntime() {
  if (process.env.ANTHROPIC_API_KEY) {
    return "claude";
  }
  if (process.env.OPENAI_API_KEY) {
    return "codex";
  }
  return "claude";
}

async function runCodex(prompt) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-nexus-code-quality-"));
  const schemaPath = path.join(tmpDir, "schema.json");
  const outputPath = path.join(tmpDir, "last-message.json");
  fs.writeFileSync(schemaPath, JSON.stringify(schema), "utf8");
  try {
    await runProcess("codex", [
      "exec",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--output-schema",
      schemaPath,
      "--output-last-message",
      outputPath,
      prompt,
    ]);
    return fs.readFileSync(outputPath, "utf8");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

async function runCli(args, options = {}) {
  try {
    const request = parseArgs(args);
    const prompt = buildReviewPrompt(request);
    const rawOutput = await (options.runReview ?? defaultRunReview)({ ...request, prompt });
    const result = parseReviewOutput(rawOutput);
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(result)}\n`,
      stderr: "",
    };
  } catch (error) {
    if (error instanceof UsageError) {
      return { exitCode: 2, stdout: "", stderr: `${error.message}\n` };
    }
    return { exitCode: 1, stdout: "", stderr: `${error.message}\n` };
  }
}

export {
  buildReviewPrompt,
  normalizeVerdict,
  parseArgs,
  parseReviewOutput,
  runCli,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runCli(process.argv.slice(2));
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
