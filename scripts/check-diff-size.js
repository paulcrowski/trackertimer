const { execFileSync } = require("child_process");
const fs = require("fs");

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function hasHead() {
  try {
    execFileSync("git", ["rev-parse", "--verify", "HEAD"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function diffArgs() {
  if (process.env.GITHUB_BASE_REF) {
    return ["diff", "--numstat", `origin/${process.env.GITHUB_BASE_REF}...HEAD`];
  }

  if (!hasHead()) {
    return null;
  }

  return ["diff", "--numstat", "HEAD"];
}

const args = diffArgs();
const taskFile = process.env.CHECK_DIFF_TASK_FILE || "tasks/todo.md";
const modeLimits = {
  MINIMAL_FIX: { files: 3, lines: 50 },
  CONTENT_FIX: { files: 3, lines: 80 },
  RUNTIME_FIX: { files: 12, lines: 250 },
  STRUCTURE_FIX: { files: 12, lines: 250 },
  FEATURE: { files: 12, lines: 250 },
  AUDIT: { files: 0, lines: 0 }
};

const output = process.env.CHECK_DIFF_NUMSTAT !== undefined
  ? process.env.CHECK_DIFF_NUMSTAT.trim()
  : args ? git(args) : "";
const localUntrackedFiles = process.env.GITHUB_BASE_REF || process.env.CHECK_DIFF_NUMSTAT !== undefined
  ? []
  : untrackedFiles();

if (!output && !localUntrackedFiles.length) {
  console.log("check:diff-size PASS - no changed files");
  process.exit(0);
}

const ignoredLargeFiles = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "Cargo.lock",
  "poetry.lock"
];

const generatedPatterns = [
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)coverage\//,
  /\.snap$/,
  /\.generated\./,
  /\.gen\./
];

const workflowPatterns = [
  /^README\.md$/,
  /^AGENTS\.md$/,
  /^AGENT_DEV_POLICY\.md$/,
  /^CODEX\.md$/,
  /^CLAUDE\.md$/,
  /^RELEASE_GATE\.md$/,
  /^TESTING\.md$/,
  /^ParkingLot\.md$/,
  /^docs\//,
  /^scripts\//,
  /^workflow\//,
  /^tasks\//,
  /^\.github\//,
  /^\.githooks\//
];

function isIgnoredLargeFile(file) {
  return ignoredLargeFiles.some(name => file.endsWith(name)) ||
    generatedPatterns.some(pattern => pattern.test(file)) ||
    workflowPatterns.some(pattern => pattern.test(file));
}

let total = 0;
let countedTotal = 0;
const countedFiles = [];
const ignoredFiles = [];
const mode = workMode();
const limit = modeLimits[mode];

for (const line of output.split("\n")) {
  if (!line) {
    continue;
  }

  const [added, removed, ...fileParts] = line.split("\t");
  const file = fileParts.join("\t");
  const a = Number(added) || 0;
  const r = Number(removed) || 0;
  const changed = a + r;

  total += changed;

  if (isIgnoredLargeFile(file)) {
    ignoredFiles.push(file);
    continue;
  }

  countedTotal += changed;
  if (!countedFiles.includes(file)) {
    countedFiles.push(file);
  }
}

for (const file of localUntrackedFiles) {
  const changed = countFileLines(file);

  total += changed;

  if (isIgnoredLargeFile(file)) {
    ignoredFiles.push(file);
    continue;
  }

  countedTotal += changed;
  if (!countedFiles.includes(file)) {
    countedFiles.push(file);
  }
}

if (countedFiles.length > limit.files) {
  console.error(`Too many files changed for ${mode}: ${countedFiles.length}. Limit: ${limit.files}. Re-plan required.`);
  console.error(`Ignored generated/lock files: ${ignoredFiles.join(", ") || "none"}`);
  process.exit(1);
}

if (countedTotal > limit.lines) {
  console.error(`Diff too large for ${mode}: ${countedTotal} counted lines. Limit: ${limit.lines}. Split into smaller AI-safe tasks.`);
  console.error(`Total including generated/lock files: ${total}`);
  console.error(`Ignored generated/lock files: ${ignoredFiles.join(", ") || "none"}`);
  process.exit(1);
}

console.log(`check:diff-size PASS - ${mode}: ${countedFiles.length}/${limit.files} counted files, ${countedTotal}/${limit.lines} counted lines`);

if (ignoredFiles.length) {
  console.log(`Ignored generated/lock files: ${ignoredFiles.join(", ")}`);
}

function untrackedFiles() {
  const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);

  if (!status) {
    return [];
  }

  return status
    .split("\n")
    .filter(line => line.startsWith("?? "))
    .map(line => line.slice(3).trim())
    .filter(file => fs.existsSync(file) && fs.statSync(file).isFile());
}

function countFileLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split("\n").length;
  } catch {
    return 0;
  }
}

function workMode() {
  if (!fs.existsSync(taskFile)) {
    console.error(`Missing ${taskFile}`);
    process.exit(1);
  }

  const txt = fs.readFileSync(taskFile, "utf8");
  const match = txt.match(/## Tryb pracy\s*\n\s*(MINIMAL_FIX|CONTENT_FIX|RUNTIME_FIX|STRUCTURE_FIX|FEATURE|AUDIT)\b/);

  if (!match) {
    console.error(`${taskFile} must select one work mode before checking diff size.`);
    process.exit(1);
  }

  return match[1];
}
