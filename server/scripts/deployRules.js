const { admin } = require("../firebaseAdmin");
const fs = require("fs");
const path = require("path");

async function deployRules() {
  console.log("Reading firestore.rules...");
  const rulesPath = path.resolve(__dirname, "../../firestore.rules");
  const rulesContent = fs.readFileSync(rulesPath, "utf8");

  console.log("Deploying updated ruleset to Firestore via Admin SDK...");
  const ruleset = await admin.securityRules().releaseFirestoreRulesetFromSource(rulesContent);
  console.log("Successfully deployed Firestore ruleset:", ruleset.name);
  console.log("Release time:", ruleset.createTime);
}

deployRules().catch(err => {
  console.error("Failed to deploy rules:", err);
  process.exit(1);
});
