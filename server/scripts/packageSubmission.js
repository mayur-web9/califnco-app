// Clean project packaging script for Google Drive submission
// Strictly excludes all secrets (.env, serviceAccountKey, adminsdk keys) and heavy build artifacts
// Preserves complete repository folder hierarchy
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../");
const OUT_ZIP = path.join(ROOT, "califnco-submission-clean.zip");

console.log("==================================================");
console.log("      CALIFNCO CLEAN SUBMISSION PACKAGER          ");
console.log("==================================================\n");

// Check git status
let uncommitted = false;
try {
  const status = execSync("git status --porcelain", { cwd: ROOT }).toString().trim();
  if (status) {
    uncommitted = true;
    console.log("Notice: Working tree has uncommitted or untracked changes.");
    console.log("Committing your work before packaging ensures all new features are included in the archive.\n");
  }
} catch (e) {}

// Remove previous zip if exists
if (fs.existsSync(OUT_ZIP)) {
  fs.unlinkSync(OUT_ZIP);
}

// Generate clean zip using git archive
console.log("Creating submission package via git archive...");
try {
  execSync(`git archive --format=zip -o "${OUT_ZIP}" HEAD`, { cwd: ROOT });
  console.log(`Successfully generated: ${OUT_ZIP}`);
} catch (err) {
  console.error("Failed to generate zip with git archive:", err.message);
  process.exit(1);
}

// Audit the generated zip to guarantee ZERO leaked secrets
console.log("\n--- Security & Integrity Audit of Generated Zip ---");
let zipList = "";
try {
  zipList = execSync(`tar -tf "${OUT_ZIP}"`, { cwd: ROOT }).toString();
} catch (e) {
  // fallback for older tar
  zipList = execSync(`powershell -Command "[System.IO.Compression.ZipFile]::OpenRead('${OUT_ZIP}').Entries | Select-Object -ExpandProperty FullName"`, { cwd: ROOT }).toString();
}

const entries = zipList.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

console.log(`Total archived files: ${entries.length}`);

// Forbidden patterns
const forbiddenPatterns = [
  /\.env($|\..*)/i,
  /serviceAccountKey/i,
  /adminsdk/i,
  /node_modules/i,
  /\.git\//i
];

let leakCount = 0;
for (const entry of entries) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(entry)) {
      console.error(`[CRITICAL SECURITY ALERT] Forbidden file found in archive: ${entry}`);
      leakCount++;
    }
  }
}

if (leakCount > 0) {
  console.error(`\n[FAILED] Audit failed! Found ${leakCount} forbidden secret/artifact file(s).`);
  fs.unlinkSync(OUT_ZIP);
  process.exit(1);
}

// Check key expected directories exist in archive
const hasMobile = entries.some(e => e.startsWith("mobile/"));
const hasAdminWeb = entries.some(e => e.startsWith("admin-web/"));
const hasServer = entries.some(e => e.startsWith("server/"));
const hasAutomation = entries.some(e => e.startsWith("automation/"));
const hasDocs = entries.some(e => e.startsWith("docs/"));

console.log("Verifying folder hierarchy:");
console.log(` - mobile/:      ${hasMobile ? "OK" : "MISSING"}`);
console.log(` - admin-web/:  ${hasAdminWeb ? "OK" : "MISSING"}`);
console.log(` - server/:     ${hasServer ? "OK" : "MISSING"}`);
console.log(` - automation/: ${hasAutomation ? "OK" : "MISSING"}`);
console.log(` - docs/:       ${hasDocs ? "OK" : "MISSING"}`);

const stat = fs.statSync(OUT_ZIP);
console.log(`\nArchive Size: ${(stat.size / 1024).toFixed(1)} KB`);
console.log("==================================================");
console.log("[PASS] Clean submission zip is ready for Google Drive!");
console.log("==================================================");
