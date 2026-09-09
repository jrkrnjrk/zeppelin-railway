const http = require("http");
const port = Number(process.env.PORT || 8080);
function dest(url) {
  return url.startsWith("/api") || url.startsWith("/auth") ? 3001 : 3002;
}
http.createServer((req, res) => {
  const proxy = http.request(
    { hostname: "127.0.0.1", port: dest(req.url || "/"), path: req.url, method: req.method, headers: req.headers },
    (up) => { res.writeHead(up.statusCode || 502, up.headers); up.pipe(res); }
  );
  proxy.on("error", () => { res.statusCode = 502; res.end("starting"); });
  req.pipe(proxy);
}).listen(port, "0.0.0.0", () => console.log("proxy on " + port));
