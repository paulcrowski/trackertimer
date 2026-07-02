const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(process.env.CHECK_PROJECT_ROOT || ".");
const packageFile = path.resolve(process.env.CHECK_PROJECT_PACKAGE_FILE || path.join(root, "package.json"));
const requiredScripts = list(process.env.CHECK_PROJECT_REQUIRED_SCRIPTS || "lint,typecheck,test,build");
const appPaths = list(process.env.CHECK_PROJECT_APP_PATHS || "src,app,pages,components,lib,server,tests");
const forceRequired = process.env.CHECK_PROJECT_REQUIRE === "1";
const dryRun = process.env.CHECK_PROJECT_DRY_RUN === "1";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function list(value) {
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

if (!fs.existsSync(packageFile)) {
  fail(`Missing package.json: ${packageFile}`);
}

const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
const scripts = pkg.scripts || {};
const detectedAppPaths = appPaths.filter(item => fs.existsSync(path.join(root, item)));
const requiresProjectGates = forceRequired || detectedAppPaths.length > 0;

if (!requiresProjectGates) {
  console.log("check:project-gates PASS - no app paths detected");
  process.exit(0);
}

const missing = requiredScripts.filter(name => !scripts[name]);
if (missing.length) {
  fail(`Missing required project scripts: ${missing.join(", ")}. Add real lint/typecheck/test/build gates.`);
}

const placeholders = requiredScripts.filter(name => isPlaceholderScript(scripts[name]));
if (placeholders.length) {
  fail(`Project scripts cannot be placeholders: ${placeholders.join(", ")}`);
}

for (const name of requiredScripts) {
  if (dryRun) {
    console.log(`check:project-gates DRY_RUN npm run ${name}`);
    continue;
  }

  console.log(`check:project-gates RUN npm run ${name}`);
  runNpm(name);
}

console.log(`check:project-gates PASS - ${requiredScripts.join(", ")}`);

function isPlaceholderScript(script) {
  const value = String(script).trim();
  return !value ||
    value === "..." ||
    value === "TODO" ||
    value.includes("TODO") ||
    /^echo\s+["']?(TODO|not implemented|placeholder)/i.test(value);
}

function runNpm(scriptName) {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `npm run ${scriptName}`], { cwd: root, stdio: "inherit" });
    return;
  }

  execFileSync("npm", ["run", scriptName], { cwd: root, stdio: "inherit" });
}
