---
name: cyy-mall
description: "Use when an Agent needs to install, verify, or operate the CyyMall / dhcmall shopping toolchain through cyymall-cli (`cyy`) or its MCP tools: login, shop/site context, product search, cart, order, pay URL, low-level api_call, MCP setup, or project capability maintenance."
---

# CyyMall Agent Skill

This skill teaches an Agent to use the CyyMall toolchain. The real implementation is the npm package `cyymall-cli`; this skill only provides install checks, usage rules, and maintenance guidance.

## First Step: Ensure CLI

When shell access is available, verify `cyy` before using it. Run the bundled script from this skill's `scripts/` directory.

```powershell
.\scripts\ensure-cyy.ps1
```

On bash-like shells:

```bash
bash scripts/ensure-cyy.sh
```

After the skill is installed into an Agent's skill directory, resolve the same scripts relative to the installed `cyy-mall` skill folder.

The script checks Node.js, npm, installs `cyymall-cli` globally if `cyy` is missing, and prints `cyy --version`. It must not ask for or store tokens.

If the host already exposes MCP tools, use the MCP tools directly and do not run shell commands unless the user asks for local setup.

## Call Surfaces

Use exactly one surface per environment:

| Environment | Use |
|---|---|
| Shell available | `cyy ...` |
| MCP connected | MCP tools from `cyy-mall-mcp` / `cyy mcp serve` |
| Project maintenance | `DEVELOPMENT_HANDBOOK.md` plus source files |

Do not create temporary scripts to bypass existing CLI or MCP capabilities. Use `cyy api call` / MCP `api_call` for spec-covered endpoints that do not yet have sugar commands.

## Credentials And Safety

- Never ask for login passwords.
- Never restate long-lived tokens in chat.
- Do not write tokens, SMS codes, npm tokens, or API keys into repository files.
- Login can use SMS (`auth send-code` then `auth login`) or external session import (`auth import` / `CYY_TOKEN`).
- Confirm with the user before high-risk writes: cart mutation, order confirmation, quick checkout, order cancellation.
- For MCP write tools, require `CYY_MCP_ALLOW_WRITE=true` or `1`; read-only tools and `order_pay_url` do not need it.

## CLI Flow

Common sequence:

```bash
cyy auth whoami
cyy config show
cyy auth send-code --phone <phone>
cyy auth login --phone <phone> --code <sms-code>
cyy shop list
cyy shop use --shop-id <id>
cyy shop sites --shop-id <id>
cyy shop use-site --site-id <id>
cyy product search --keyword <keyword>
```

Category browsing:

```bash
cyy product category-list
cyy product zone-tags --group-id <second-level-children-id>
cyy product category-skus --group-id <same> --zone-key <key>
cyy product skus-by-category --group-id <same>
```

Order-related commands:

```bash
cyy cart add --body-file cart.json
cyy order pre-settle --body-file pre.json
cyy order confirm --body-file confirm.json
cyy order checkout --keyword <keyword> --pre-settle-only
cyy order list
cyy order cancel --order-id <id>
cyy order pay-url --order-id <id>
```

Use `--body-file` for complex JSON. Summarize JSON output for users unless they explicitly ask to see raw output.

## MCP Flow

Host labels such as `cyy-mall` are just local MCP server names chosen by the orchestrator config. They are not npm package names and are not the `cyy` CLI command.

MCP hosts can launch either:

```json
{
  "mcpServers": {
    "cyy-mall": {
      "command": "npx",
      "args": ["-y", "cyy-mall-mcp"],
      "env": {
        "CYY_MCP_ALLOW_WRITE": "false"
      }
    }
  }
}
```

or direct CLI MCP:

```json
{
  "mcpServers": {
    "cyy-mall": {
      "command": "npx",
      "args": ["-y", "cyymall-cli", "mcp", "serve"],
      "env": {
        "CYY_MCP_ALLOW_WRITE": "false"
      }
    }
  }
}
```

Recommended MCP sequence:

1. `auth_whoami` or `config_show`
2. `auth_import`, or `auth_send_code_v1` then `auth_login`
3. `shop_list` -> `shop_use` -> `shop_sites` -> `shop_use_site`
4. `product_search`, or category tools
5. `order_list` for read-only order lookup
6. Write tools only after user confirmation and write gate

Prefer structured tools when possible:

- `cart_add_items` over raw `cart_add`
- `order_confirm_pre_settle` over raw `order_confirm`

Full MCP input/output details live in `MCP_TOOLS_IO.md`.

## Session Profiles

Use `CYY_PROFILE=<name>` to isolate multiple users, Agents, shops, or environments. Default session path is `~/.cyymall/config.json`; named profiles use `~/.cyymall/profiles/<name>.json`.

## Maintenance

For project changes, use `DEVELOPMENT_HANDBOOK.md` as the workflow source.

Keep this chain aligned when capabilities change:

- `app-api-cli-spec.md`
- `cyymall-cli/src/commands/*`
- `cyymall-cli/src/cli.js`
- `cyymall-cli/src/mcpToolManifest.js`
- `cyymall-cli/src/mcpServer.js`
- `MCP_TOOLS_IO.md`
- `MCP_AGENT_PROMPT.md`
- `CAPABILITY_MATRIX.md`
- README files

Run relevant verification before claiming completion.
