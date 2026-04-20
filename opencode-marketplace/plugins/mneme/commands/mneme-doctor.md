---
description: Check mneme system health — runtime availability, server status, database health, and configuration
---

# mneme doctor

Run system health diagnostics.

## Instructions

Run the following command and display the output as a checklist:

```bash
mneme doctor --json
```

Format each check as:
- ✓ Check name — detail (if passed)
- ✗ Check name — detail (if failed)

Checks include: server connectivity, database status, runtime availability
(JavaScript, Python, Shell, etc.), index health, and configuration validity.
