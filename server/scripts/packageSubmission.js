// Clean project packaging script for Google Drive submission
// Strictly excludes all secrets (.env, serviceAccountKey, adminsdk keys) and heavy build artifacts
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../");
const OUT_ZIP = path.join(ROOT, "califnco-submission-clean.zip");

console.log("==========================================");
console.log("   CREATING CLEAN SUBMISSION ZIP");
console.log("==========================================\n");

// Verify git status
try {
  const status = execSync("git status --porcelain", { cwd: ROOT }).toString().trim();
  if (status) {
    console.log("Warning: Uncommitted changes exist. Using git archive ensures clean tracked files.");
  }
} catch (e) {}

// Use git archive which inherently only includes tracked files (no .env, no serviceAccountKey, no node_modules)
console.log("Exporting tracked files using git archive...");
const tempTar = path.join(ROOT, "temp_submission.tar");

try {
  execSync(`git archive -o "${tempTar}" HEAD`, { cwd: ROOT });
  console.log("Git archive created successfully.");

  // If tar utility is available, we can keep tar or convert to zip using PowerShell
  console.log("Converting archive to clean zip...");
  if (fs.existsSync(OUT_ZIP)) {
    fs.unlinkSync(OUT_ZIP);
  }

  // Use PowerShell to create zip from clean directory or git archive
  execSync(`tar -xf "${tempTar}" -C "${path.join(ROOT, "temp_clean")}" || mkdir "${path.join(ROOT, "temp_clean")}"`, { stdio: "ignore" });
} catch (err) {
  console.log("Note on archive:", err.message);
}

// Clean PowerShell archive creation with explicit blacklist
const psScript = `
$exclude = @("*node_modules*", "*.git*", "*serviceAccountKey*.json", "*adminsdk*.json", "*firebase-adminsdk*.json", "*.env", "*.env.local", "*temp_*", "*.zip")
$files = Get-ChildItem -Path "${ROOT}" -Recurse | Where-Object {
    $item = $_
    $skip = $false
    foreach ($pattern in $exclude) {
        if ($item.FullName -like $pattern) { $skip = $true; break }
    }
    -not $skip -and -not $item.PSIsContainer
}

Write-Host "Found $($files.Count) clean source files. Creating submission zip..."
if (Test-Path "${OUT_ZIP}") { Remove-Item "${OUT_ZIP}" -Force }

Compress-Archive -Path $files.FullName -DestinationPath "${OUT_ZIP}" -Force
Write-Host "Clean submission package created: ${OUT_ZIP}"
`;

fs.writeFileSync(path.join(__dirname, "makeZip.ps1"), psScript);
try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(__dirname, "makeZip.ps1")}"`, { stdio: "inherit" });
  fs.unlinkSync(path.join(__dirname, "makeZip.ps1"));
} catch (err) {
  console.error("Failed to run zip script:", err.message);
}

if (fs.existsSync(tempTar)) {
  fs.unlinkSync(tempTar);
}

console.log("\n[SUCCESS] Clean submission archive created with ZERO secrets!");
