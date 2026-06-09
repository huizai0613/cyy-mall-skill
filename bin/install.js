#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const skillName = "cyy-mall";

function usage() {
  return `Usage:
  npx cyy-mall-skill [options]

Options:
  --target <codex|claude|agents|all>  Install target. Default: codex
  --dest <path>                       Install into a custom skills directory or skill directory
  --force                             Overwrite an existing cyy-mall skill
  --zh                                Install SKILL_ZH.md as SKILL.md when available
  --help                              Show this help

Examples:
  npx cyy-mall-skill
  npx cyy-mall-skill --target all --force
  npx cyy-mall-skill --dest ~/.codex/skills
`;
}

function parseArgs(argv) {
  const options = {
    target: "codex",
    dest: "",
    force: false,
    zh: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--zh") {
      options.zh = true;
    } else if (arg === "--target") {
      options.target = requireValue(argv, ++i, "--target");
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--dest") {
      options.dest = requireValue(argv, ++i, "--dest");
    } else if (arg.startsWith("--dest=")) {
      options.dest = arg.slice("--dest=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function homeDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) {
    throw new Error("Cannot determine home directory from HOME or USERPROFILE.");
  }
  return home;
}

function expandPath(input) {
  if (!input) {
    return input;
  }
  if (input === "~") {
    return homeDir();
  }
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(homeDir(), input.slice(2));
  }
  return path.resolve(input);
}

function defaultSkillsDirs(target) {
  const home = homeDir();
  const dirs = {
    codex: [path.join(home, ".codex", "skills")],
    claude: [path.join(home, ".claude", "skills")],
    agents: [path.join(home, ".agents", "skills")],
  };

  if (target === "all") {
    return [...dirs.codex, ...dirs.claude, ...dirs.agents];
  }
  if (!Object.hasOwn(dirs, target)) {
    throw new Error(`Unsupported target: ${target}`);
  }
  return dirs[target];
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveDestinations(options) {
  if (!options.dest) {
    return defaultSkillsDirs(options.target).map((skillsDir) => path.join(skillsDir, skillName));
  }

  const dest = expandPath(options.dest);
  const base = path.basename(dest);
  if (base === skillName) {
    return [dest];
  }
  return [path.join(dest, skillName)];
}

async function copySkill(destination, options) {
  const alreadyExists = await exists(destination);
  if (alreadyExists && !options.force) {
    throw new Error(`${destination} already exists. Re-run with --force to overwrite.`);
  }

  if (alreadyExists) {
    await fs.rm(destination, { recursive: true, force: true });
  }

  await fs.mkdir(path.join(destination, "scripts"), { recursive: true });

  const skillSource = options.zh && (await exists(path.join(packageRoot, "SKILL_ZH.md")))
    ? path.join(packageRoot, "SKILL_ZH.md")
    : path.join(packageRoot, "SKILL.md");

  await fs.copyFile(skillSource, path.join(destination, "SKILL.md"));
  await fs.copyFile(path.join(packageRoot, "scripts", "ensure-cyy.ps1"), path.join(destination, "scripts", "ensure-cyy.ps1"));
  await fs.copyFile(path.join(packageRoot, "scripts", "ensure-cyy.sh"), path.join(destination, "scripts", "ensure-cyy.sh"));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const destinations = await resolveDestinations(options);
  for (const destination of destinations) {
    await copySkill(destination, options);
    console.log(`[cyy-mall-skill] Installed ${skillName} to ${destination}`);
  }

  console.log("[cyy-mall-skill] Restart your Agent host to reload skills.");
  console.log("[cyy-mall-skill] Then ask the Agent to use cyy-mall, or run the bundled ensure-cyy script.");
}

main().catch((error) => {
  console.error(`[cyy-mall-skill] ${error.message}`);
  process.exitCode = 1;
});
