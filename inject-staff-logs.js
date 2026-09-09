const fs = require("fs");
const path = require("path");
const roots = ["/zeppelin/backend/dist", "/zeppelin/backend/src"];
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}
const needle = /isStaffPreFilter\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*return isStaff\([^)]+\);[^}]*\}/;
const replacement = `isStaffPreFilter = (_, context) => {
  const id = context.message && context.message.author && context.message.author.id;
  const content = (context.message && context.message.content) || "";
  const ok = isStaff(id);
  console.log("[STAFF CMD] user=" + id + " allowed=" + ok + " content=" + content);
  if (!ok) console.log("[STAFF CMD] ignored — user is not in STAFF env");
  return ok;
}`;
let hits = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    const orig = fs.readFileSync(file, "utf8");
    if (!orig.includes("isStaffPreFilter")) continue;
    const next = orig.replace(needle, replacement);
    if (next !== orig) {
      fs.writeFileSync(file, next);
      console.log("[STAFF CMD] patched", file);
      hits++;
    } else {
      console.log("[STAFF CMD] found isStaffPreFilter but pattern miss:", file);
    }
  }
}
if (!hits) console.log("[STAFF CMD] no file patched — staff ignores will stay silent");
