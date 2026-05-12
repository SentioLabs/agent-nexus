import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { runCli } from "./agent-nexus.mjs";

const execFile = promisify(execFileCallback);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const agentNexusEntrypoint = path.join(scriptDir, "agent-nexus");
const sizeCommandDoc = path.resolve(scriptDir, "../../claude-marketplace/plugins/code-quality/commands/size.md");
const sizeSkillDoc = path.resolve(scriptDir, "../../claude-marketplace/plugins/code-quality/skills/size-review/SKILL.md");

function makeRunner(rawOutput) {
  const calls = [];
  return {
    calls,
    run: async (request) => {
      calls.push(request);
      return rawOutput;
    },
  };
}

test("runs slop review for a PR and emits normalized JSON markdown", async () => {
  const runner = makeRunner(JSON.stringify({
    verdict: "Mild concerns",
    report_markdown: "# Code Quality Slop Review\n\n## Verdict\n\nConcerns found.\n",
  }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "42",
    "--mode",
    "slop",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.equal(runner.calls.length, 1);
  assert.equal(runner.calls[0].mode, "slop");
  assert.match(runner.calls[0].prompt, /\/code-quality:slop #42/);
  assert.doesNotMatch(runner.calls[0].prompt, /size-review-exclude|--exclude/);

  const output = JSON.parse(result.stdout);
  assert.deepEqual(output, {
    verdict: "concerns",
    report_markdown: "# Code Quality Slop Review\n\n## Verdict\n\nConcerns found.\n",
  });
});

test("passes size-review-exclude through to size-capable reviews", async () => {
  const runner = makeRunner(JSON.stringify({
    verdict: "Appropriately sized",
    report_markdown:
      "# Code Quality Size Review\n\nPaths matching `docs/**` were excluded from the size assessment.\n",
  }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "43",
    "--mode",
    "size",
    "--size-review-exclude",
    "docs/**",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 0);
  assert.equal(runner.calls.length, 1);
  assert.equal(runner.calls[0].mode, "size");
  assert.match(runner.calls[0].prompt, /\/code-quality:size #43 --exclude docs\/\*\*/);

  const output = JSON.parse(result.stdout);
  assert.equal(output.verdict, "pass");
  assert.match(output.report_markdown, /^# Code Quality Size Review/);
  assert.match(output.report_markdown, /`docs\/\*\*` were excluded/);
});

test("quotes size-review-exclude patterns with spaces in the size review prompt", async () => {
  const runner = makeRunner(JSON.stringify({
    verdict: "Appropriately sized",
    report_markdown: "# Code Quality Size Review\n\nExcluded generated fixtures.\n",
  }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "43",
    "--mode",
    "size",
    "--size-review-exclude",
    "generated fixtures/**",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 0);
  assert.match(runner.calls[0].prompt, /\/code-quality:size #43 --exclude "generated fixtures\/\*\*"/);
});

test("documents CLI-supplied size review exclusions in the code-quality size command", () => {
  const doc = fs.readFileSync(sizeCommandDoc, "utf8");

  assert.match(doc, /--exclude <pattern>/);
  assert.match(doc, /CLI-supplied exclusions/);
});

test("documents invocation-supplied size review exclusions in the size-review skill", () => {
  const doc = fs.readFileSync(sizeSkillDoc, "utf8");

  assert.match(doc, /invocation-supplied `--exclude` patterns/);
  assert.match(doc, /augment/);
});

test("runs both reviews in one invocation and returns the most severe normalized verdict", async () => {
  const runner = makeRunner(JSON.stringify({
    verdict: "Splittable — moderate",
    report_markdown:
      "# Code Quality Review\n\n## Slop Review\n\nNo slop findings.\n\n## Size Review\n\nSplit recommended for reviewability.\n",
  }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "44",
    "--mode",
    "both",
    "--size-review-exclude",
    "generated/**",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 0);
  assert.equal(runner.calls.length, 1);
  assert.equal(runner.calls[0].mode, "both");
  assert.match(
    runner.calls[0].prompt,
    /\/code-quality:slop #44\n\/code-quality:size #44 --exclude generated\/\*\*/,
  );

  const output = JSON.parse(result.stdout);
  assert.equal(output.verdict, "fail");
  assert.match(output.report_markdown, /## Slop Review/);
  assert.match(output.report_markdown, /## Size Review/);
});

test("rejects size-review-exclude for slop mode before running a review", async () => {
  const runner = makeRunner("{}");

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "45",
    "--mode",
    "slop",
    "--size-review-exclude",
    "docs/**",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /--size-review-exclude cannot be used with --mode slop/);
  assert.equal(runner.calls.length, 0);
});

test("normalizes malformed or unknown verdicts to concerns while preserving markdown", async () => {
  const runner = makeRunner(JSON.stringify({
    verdict: "unexpected model wording",
    report_markdown: "# Code Quality Review\n\nThe model returned a non-contract verdict.\n",
  }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "46",
    "--mode",
    "slop",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.verdict, "concerns");
  assert.match(output.report_markdown, /non-contract verdict/);
});

test("normalizes mixed pass and fail wording to fail", async () => {
  const runner = makeRunner(JSON.stringify({
    verdict: "passes overall, but has a blocking size concern",
    report_markdown: "# Code Quality Review\n\nBlocking issue despite pass-like wording.\n",
  }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "47",
    "--mode",
    "both",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.verdict, "fail");
});

test("fails closed when runtime output is not valid review JSON", async () => {
  const runner = makeRunner("runtime completed without json");

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "48",
    "--mode",
    "slop",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /runtime output must be a JSON object with non-empty string report_markdown/);
});

test("fails closed when runtime output wraps valid review JSON in noise", async () => {
  const runner = makeRunner(`Here is the result: ${JSON.stringify({
    verdict: "pass",
    report_markdown: "# Code Quality Review\n\nWrapped JSON should be rejected.\n",
  })}`);

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "49",
    "--mode",
    "slop",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /runtime output must be a JSON object with non-empty string report_markdown/);
});

test("fails closed when runtime JSON omits non-empty report markdown", async () => {
  const runner = makeRunner(JSON.stringify({ verdict: "pass", report_markdown: "" }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "49",
    "--mode",
    "slop",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /runtime output must be a JSON object with non-empty string report_markdown/);
});

test("fails closed when runtime JSON report markdown is only whitespace", async () => {
  const runner = makeRunner(JSON.stringify({ verdict: "pass", report_markdown: "  \n\t  " }));

  const result = await runCli([
    "code-quality",
    "review",
    "--pr-number",
    "50",
    "--mode",
    "slop",
  ], { runReview: runner.run });

  assert.equal(result.exitCode, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /runtime output must be a JSON object with non-empty string report_markdown/);
});

test("contracted agent-nexus executable invokes code-quality review with fake runtime", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-nexus-test-"));
  const fakeRuntime = path.join(tmpDir, "claude");
  const argsPath = path.join(tmpDir, "args.json");
  fs.writeFileSync(fakeRuntime, `#!/usr/bin/env node\nimport fs from "node:fs";\nfs.writeFileSync(${JSON.stringify(argsPath)}, JSON.stringify(process.argv.slice(2)), "utf8");\nprocess.stdout.write(JSON.stringify({ verdict: "pass", report_markdown: "# Code Quality Review\\n\\nFake runtime succeeded.\\n" }));\n`, { mode: 0o755 });

  try {
    const result = await execFile(agentNexusEntrypoint, [
      "code-quality",
      "review",
      "--pr-number",
      "50",
      "--mode",
      "size",
      "--size-review-exclude",
      "docs with spaces/**",
    ], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: "test-key",
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH ?? ""}`,
      },
    });

    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout), {
      verdict: "pass",
      report_markdown: "# Code Quality Review\n\nFake runtime succeeded.\n",
    });

    const runtimeArgs = JSON.parse(fs.readFileSync(argsPath, "utf8"));
    assert.ok(runtimeArgs.includes("--plugin-dir"));
    assert.match(runtimeArgs.at(-1), /\/code-quality:size #50 --exclude "docs with spaces\/\*\*"/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
