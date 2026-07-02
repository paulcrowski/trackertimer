const fs = require("fs");

const file = process.env.CHECK_TASK_FILE || "tasks/todo.md";

if (!fs.existsSync(file)) {
  console.error("Missing tasks/todo.md");
  process.exit(1);
}

const txt = fs.readFileSync(file, "utf8");

const mode = workMode(txt);
const requiredCommon = [
  "## Tryb pracy",
  "## Cel / Outcome",
  "## Kryteria sukcesu",
  "## Priorytet / Blocker",
  "## Kontekst dla agenta",
  "## Zakres",
  "## Escalation",
  "## Klasyfikacja",
  "## Diagnoza",
  "## Plan",
  "## Weryfikacja",
  "## Review / Wyniki"
];
const requiredByMode = {
  MINIMAL_FIX: requiredCommon,
  CONTENT_FIX: requiredCommon,
  AUDIT: [
    ...requiredCommon.filter(name => name !== "## Diagnoza" && name !== "## Plan"),
    "## Fakty",
    "## Dowody",
    "## Ryzyka",
    "## Plan naprawczy"
  ],
  RUNTIME_FIX: [
    ...requiredCommon,
    "## Reprodukcja / dowód problemu",
    "## Granice",
    "## Kontrakt",
    "## Failure modes",
    "## Guard Scope",
    "## Definition of Done"
  ],
  STRUCTURE_FIX: [
    ...requiredCommon,
    "## Reprodukcja / dowód problemu",
    "## Granice",
    "## Kontrakt",
    "## Failure modes",
    "## Guard Scope",
    "## Definition of Done"
  ],
  FEATURE: [
    ...requiredCommon,
    "## Reprodukcja / dowód problemu",
    "## Granice",
    "## Kontrakt",
    "## Failure modes",
    "## Guard Scope",
    "## Definition of Done"
  ]
};
const required = requiredByMode[mode];

const missing = required.filter(x => !txt.includes(x));

if (missing.length) {
  console.error(`${file} missing sections:`, missing.join(", "));
  process.exit(1);
}

const placeholderPatterns = [
  /^\s*\.\.\.\s*$/m,
  /MINIMAL_FIX \/ CONTENT_FIX \/ RUNTIME_FIX \/ STRUCTURE_FIX \/ FEATURE \/ AUDIT:/,
  /Tryb zmiany:\s*code-change \/ audit-only \/ release-build/,
  /REQUIRED \/ NICE_TO_HAVE \/ OVERBUILD:/,
  /TAK \/ NIE/,
  /YES \/ NO \/ NOT_NEEDED/,
  /^\s*-\s+\.\.\.\s*$/m,
  /- \[ \] Krok 1/,
  /PASS \/ FAIL:\s*$/m
];

for (const pattern of placeholderPatterns) {
  if (pattern.test(txt)) {
    console.error(`tasks/todo.md still contains template placeholder: ${pattern}`);
    process.exit(1);
  }
}

function section(name) {
  const match = txt.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return match ? match[1].trim() : "";
}

const classification = section("Klasyfikacja");
if (!/^(REQUIRED|NICE_TO_HAVE|OVERBUILD)\b/m.test(classification)) {
  console.error("tasks/todo.md must select one change classification.");
  process.exit(1);
}

const blocker = section("Priorytet / Blocker");
const blockerMovesTask = blocker.match(/^Czy ten task rusza blocker:\s*(TAK|NIE)\s*$/mi);
const blockerReason = blocker.match(/^Jeśli NIE, powód:\s*([A-Z_]+)\s*$/mi);
const allowedBlockerReasons = new Set([
  "BLOCKED_EXTERNAL_STATE",
  "REQUIRED_PREREQUISITE",
  "RISKY_WITHOUT_AUDIT",
  "SMALL_FIX_UNBLOCKING_MAIN_WORK",
  "NOT_APPLICABLE"
]);
if (!/^Największy blocker teraz:\s*\S.+$/mi.test(blocker)) {
  console.error(`${file} Priorytet / Blocker must name the current biggest blocker.`);
  process.exit(1);
}
if (!/^Dowód blockera:\s*\S.+$/mi.test(blocker)) {
  console.error(`${file} Priorytet / Blocker must include 'Dowód blockera: ...'.`);
  process.exit(1);
}
if (!blockerMovesTask) {
  console.error(`${file} Priorytet / Blocker must include 'Czy ten task rusza blocker: TAK|NIE'.`);
  process.exit(1);
}
if (!blockerReason || !allowedBlockerReasons.has(blockerReason[1])) {
  console.error(`${file} Priorytet / Blocker must include allowed 'Jeśli NIE, powód'.`);
  process.exit(1);
}
if (blockerMovesTask[1] === "TAK" && blockerReason[1] !== "NOT_APPLICABLE") {
  console.error(`${file} must use 'Jeśli NIE, powód: NOT_APPLICABLE' when task moves the blocker.`);
  process.exit(1);
}
if (blockerMovesTask[1] === "NIE" && !/^Dlaczego mimo to robimy teraz:\s*\S.+$/mi.test(blocker)) {
  console.error(`${file} must explain why this task proceeds despite not moving the biggest blocker.`);
  process.exit(1);
}
if (blockerMovesTask[1] === "NIE" && !/^Warunek powrotu do blockera:\s*\S.+$/mi.test(blocker)) {
  console.error(`${file} must include 'Warunek powrotu do blockera' when task does not move the blocker.`);
  process.exit(1);
}
if (blockerMovesTask[1] === "NIE" && consecutiveNonBlockerTasks() >= 1) {
  console.error(`${file} cannot be another task that does not move the blocker. Return to blocker or update blocker explicitly.`);
  process.exit(1);
}

const review = section("Review / Wyniki");
if (!/(^|\n)PASS \/ FAIL:\s*(PASS|FAIL|Nie uruchomiono testów)/i.test(review)) {
  console.error("tasks/todo.md Review / Wyniki must include concrete 'PASS / FAIL: PASS|FAIL|Nie uruchomiono testów'.");
  process.exit(1);
}

const hasOverbuildClassification = /## Klasyfikacja[\s\S]*OVERBUILD[\s\S]*Uzasadnienie:/i.test(txt);
const hasOverbuildGuards = /## Guard Scope[\s\S]*OVERBUILD GUARDS:/i.test(txt);
const parkingLotStatus = txt.match(/ParkingLot\.md updated:\s*(YES|NO|NOT_NEEDED)/i);

if ((hasOverbuildClassification || hasOverbuildGuards) && !parkingLotStatus) {
  console.error("OVERBUILD requires explicit 'ParkingLot.md updated: YES / NO / NOT_NEEDED'.");
  process.exit(1);
}

if (hasOverbuildClassification && /ParkingLot\.md updated:\s*NO/i.test(txt)) {
  console.error("Task classified as OVERBUILD cannot proceed unless moved to ParkingLot.md or marked NOT_NEEDED with justification.");
  process.exit(1);
}

console.log("check:task PASS");

function workMode(body) {
  const match = body.match(/## Tryb pracy\s*\n\s*(MINIMAL_FIX|CONTENT_FIX|RUNTIME_FIX|STRUCTURE_FIX|FEATURE|AUDIT)\b/);
  if (!match) {
    console.error("tasks/todo.md must select one work mode.");
    process.exit(1);
  }
  return match[1];
}

function consecutiveNonBlockerTasks() {
  if (process.env.CHECK_TASK_SKIP_ARCHIVE === "1") return 0;
  const archiveDir = process.env.CHECK_TASK_ARCHIVE_DIR || "tasks/archive";
  if (!fs.existsSync(archiveDir)) return 0;

  const files = fs.readdirSync(archiveDir)
    .filter(name => name.endsWith(".md"))
    .map(name => `${archiveDir}/${name}`)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const last = files[0];
  if (!last) return 0;

  const archived = fs.readFileSync(last, "utf8");
  const archivedBlocker = archived.match(/## Priorytet \/ Blocker\n([\s\S]*?)(?=\n## |$)/);
  if (!archivedBlocker) return 0;

  return /^Czy ten task rusza blocker:\s*NIE\s*$/mi.test(archivedBlocker[1]) ? 1 : 0;
}
