const fs = require("fs");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = require("path").join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

const files = ["/zeppelin/backend/dist", "/zeppelin/backend/src"].flatMap((r) => walk(r));

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  s = s.replace(/void\s+\(msg\.channel && msg\.channel\.send\)\(/g, "void msg.channel?.send(");
  s = s.replace(/void\s+\(message\.channel && message\.channel\.send\)\(/g, "void message.channel?.send(");
  s = s.replace(/void\s+msg\.channel\.send\(/g, "void msg.channel?.send(");
  s = s.replace(/void\s+message\.channel\.send\(/g, "void message.channel?.send(");

  if (file.endsWith("ApiPermissionAssignments.js") && s.includes("addUser")) {
    s = s.replace(/this\.apiPermissions\.insert\(/g, "this.apiPermissions.save(");
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("[PATCH]", file);
  }
}

console.log("[PATCH] done");
