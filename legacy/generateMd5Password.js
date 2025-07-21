const crypto = require("crypto");

if (process.argv.length !== 3) {
  console.error("Usage: node makePassword.js <password>");
  process.exit(1);
}

const password = process.argv[2];
const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

console.log(`MD5 hash of '${password}': ${hashedPassword}`);