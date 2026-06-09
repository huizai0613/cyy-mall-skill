# CyyMall Skill

Codex/Agent skill for operating the CyyMall / dhcmall shopping toolchain.

The skill does not contain the CLI implementation. It teaches an Agent how to verify, install, and safely use:

- `cyymall-cli` npm package
- `cyy` CLI command
- `cyy-mall-mcp` MCP launcher
- `cyy mcp serve` built-in MCP server

## Install

Recommended npm installer:

```bash
npx cyy-mall-skill
```

Install to all common local Agent skill directories:

```bash
npx cyy-mall-skill --target all
```

Use `--force` to overwrite an existing local copy:

```bash
npx cyy-mall-skill --force
```

Install the Chinese skill body:

```bash
npx cyy-mall-skill --zh
```

Install into a custom skills directory:

```bash
npx cyy-mall-skill --dest ~/.codex/skills
```

You can also install this repository as one GitHub skill. The skill root is this repository root, containing `SKILL.md`.

On Windows, if `npx` installs the package but cannot execute it, make sure npm's global prefix is in the current `PATH`:

```powershell
$env:PATH = "$(npm config get prefix);$env:PATH"
npx cyy-mall-skill
```

After installation, restart the Agent host so the skill metadata is reloaded.

## Runtime Setup

When shell access is available, the Agent should run the bundled script from the installed skill directory:

```powershell
.\scripts\ensure-cyy.ps1
```

On bash-like shells:

```bash
bash scripts/ensure-cyy.sh
```

The scripts check Node.js/npm, install `cyymall-cli` globally if `cyy` is missing, and print `cyy --version`.

## Safety

The skill tells Agents not to ask for passwords, not to echo long-lived tokens, and to require user confirmation before cart/order write actions.
