---
description: First-run setup and validation — checks binary, server, and guides installation
---

# mneme setup

Validate mneme installation and guide setup if needed.

## Instructions

### Step 1: Check binary

```bash
which mneme && mneme --version
```

If `mneme` is not found, guide the user:

```text
mneme is not installed. Build from source:
  git clone https://github.com/sentiolabs/mneme
  cd mneme
  cargo build --release
  cp target/release/mneme ~/.cargo/bin/
```

### Step 2: Check server

```bash
mneme doctor --json
```

If the server is not running, guide the user:

```text
The mneme server is not running. Start it with:
  mneme server start
```

### Step 3: Verify

```bash
mneme stats --json
```

If all checks pass, confirm: "mneme is installed and running correctly."

## Codex note

If Codex plugin hooks are installed, transparent mneme routing depends on both:

- a reachable daemon
- the hook commands using explicit transport, for example:

```bash
mneme hook pretooluse --platform codex --server 127.0.0.1:7435
```
