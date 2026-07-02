const fs = require("fs");

const taskFile = process.env.CHECK_TASK_FILE || "tasks/todo.md";
const today = process.env.CHECK_TASK_TODAY || new Date().toISOString().slice(0, 10);
const maxAgeDays = Number(process.env.CHECK_TASK_MAX_AGE_DAYS || 3);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(taskFile)) {
  fail(`Missing ${taskFile}`);
}

const txt = fs.readFileSync(taskFile, "utf8");

const id = field("Task ID");
const date = field("Task Date");
const status = field("Task Status");

if (!id) fail(`${taskFile} must include 'Task ID: YYYY-MM-DD-slug'.`);
if (!date) fail(`${taskFile} must include 'Task Date: YYYY-MM-DD'.`);
if (!status) fail(`${taskFile} must include 'Task Status: ACTIVE' or 'READY_FOR_NEXT_TASK'.`);

if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*$/.test(id)) {
  fail(`Invalid Task ID '${id}'. Expected YYYY-MM-DD-slug.`);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  fail(`Invalid Task Date '${date}'. Expected YYYY-MM-DD.`);
}

if (!id.startsWith(`${date}-`)) {
  fail(`Task ID '${id}' must start with Task Date '${date}-'.`);
}

if (status === "READY_FOR_NEXT_TASK") {
  if (!id.endsWith("-ready-for-next-task")) {
    fail(`Ready task must use Task ID '*-ready-for-next-task'. Found: ${id}`);
  }

  console.log(`check:task-freshness PASS - ${id}, ${status}`);
  process.exit(0);
}

if (status !== "ACTIVE") {
  fail(`Task Status must be ACTIVE for the current task. Found: ${status}`);
}

const age = daysBetween(date, today);

if (age < 0) {
  fail(`Task Date '${date}' is in the future relative to ${today}.`);
}

if (age > maxAgeDays) {
  fail(`Task Date '${date}' is ${age} days old. Refresh tasks/todo.md before changing code.`);
}

console.log(`check:task-freshness PASS - ${id}, ${status}, age ${age}d`);

function field(name) {
  const match = txt.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "m"));
  return match ? match[1].trim() : "";
}

function daysBetween(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    fail(`Cannot parse task dates: ${from}, ${to}`);
  }

  return Math.floor((end - start) / 86400000);
}
