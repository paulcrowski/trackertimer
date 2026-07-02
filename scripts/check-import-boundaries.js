const fs = require("fs");
const path = require("path");

const root = path.resolve(process.env.CHECK_IMPORT_ROOT || ".");
const configFile = path.resolve(process.env.CHECK_IMPORT_CONFIG || path.join(root, "workflow/import-boundaries.json"));

if (!fs.existsSync(configFile)) {
  console.log("check:import-boundaries PASS - no workflow/import-boundaries.json");
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
if (config.enabled === false) {
  console.log("check:import-boundaries PASS - disabled");
  process.exit(0);
}

const exts = config.extensions || [".ts", ".tsx", ".js", ".jsx"];
const aliases = config.aliases || {};
const layers = config.layers || [];
const ignore = (config.ignore || []).map(glob);

if (!layers.length) fail(`${configFile} must define at least one layer.`);

const files = (config.sourceRoots || ["src"])
  .map(item => path.join(root, item))
  .filter(fs.existsSync)
  .flatMap(walk)
  .filter(file => exts.includes(path.extname(file)))
  .filter(file => !ignore.some(pattern => pattern.test(rel(file))));

const violations = [];

for (const file of files) {
  const sourceLayer = layerFor(rel(file));
  if (!sourceLayer) continue;

  for (const specifier of imports(fs.readFileSync(file, "utf8"))) {
    const target = resolveImport(file, specifier);
    if (!target) continue;

    const targetLayer = layerFor(rel(target));
    if (targetLayer && !(sourceLayer.allow || []).includes(targetLayer.name)) {
      violations.push(`${rel(file)} (${sourceLayer.name}) imports ${rel(target)} (${targetLayer.name}) via '${specifier}'`);
    }
  }
}

if (violations.length) fail(`Import boundary violations:\n- ${violations.join("\n- ")}`);

console.log(`check:import-boundaries PASS - ${files.length} files checked`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.isFile() ? [full] : [];
  });
}

function rel(file) { return path.relative(root, file).split(path.sep).join("/"); }

function layerFor(file) {
  return layers.find(layer => (layer.files || []).some(pattern => glob(pattern).test(file)));
}

function imports(source) {
  const found = [];
  const pattern = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = pattern.exec(source))) found.push(match[1] || match[2]);
  return found;
}

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith(".")) return existing(path.resolve(path.dirname(fromFile), specifier));
  for (const [prefix, target] of Object.entries(aliases)) {
    if (specifier.startsWith(prefix)) return existing(path.join(root, target, specifier.slice(prefix.length)));
  }
  return null;
}

function existing(base) {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of exts) if (fs.existsSync(`${base}${ext}`)) return `${base}${ext}`;
  for (const ext of exts) {
    const indexFile = path.join(base, `index${ext}`);
    if (fs.existsSync(indexFile)) return indexFile;
  }
  return null;
}

function glob(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§")
    .replace(/\*/g, "[^/]*")
    .replace(/§/g, ".*");
  return new RegExp(`^${escaped}$`);
}
