const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

const files = ["/zeppelin/backend/dist", "/zeppelin/backend/src"].flatMap((r) => walk(r));

function writeIfChanged(file, next, orig) {
  if (next !== orig) {
    fs.writeFileSync(file, next);
    console.log("[PATCH]", file);
  }
}

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  s = s.replace(/void\s+msg\.channel\.send\(/g, "void (msg.channel && msg.channel.send)(");
  s = s.replace(/void\s+message\.channel\.send\(/g, "void (message.channel && message.channel.send)(");

  if (file.endsWith("ApiPermissionAssignments.js") && s.includes("addUser")) {
    s = s.replace(
      /this\.apiPermissions\.insert\(/g,
      "this.apiPermissions.save("
    );
  }

  writeIfChanged(file, s, orig);
}

console.log("[PATCH] done, files=", files.length);
