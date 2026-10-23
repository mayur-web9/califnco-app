const fs = require("fs");
const path = require("path");

function stripBom(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== "node_modules" && f.name !== ".git") {
      stripBom(full);
    } else if (f.isFile() && (f.name.endsWith(".json") || f.name.endsWith(".js") || f.name.endsWith(".md"))) {
      const buf = fs.readFileSync(full);
      if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        fs.writeFileSync(full, buf.subarray(3));
        console.log("Stripped BOM from:", full);
      }
    }
  }
}

stripBom(path.resolve(__dirname, "../../"));
console.log("BOM cleanup complete.");
