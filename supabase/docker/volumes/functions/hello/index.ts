import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end('"Hello from Edge Functions!"');
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
