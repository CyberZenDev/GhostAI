import { createServer } from "http";
import * as jose from "jose";

console.log("main function started");

const server = createServer((req, res) => {
  // Example JWT verification logic
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jose.decodeJwt(token);
      console.log("Decoded JWT:", decoded);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ msg: "JWT is valid" }));
    } catch (error) {
      console.error("Invalid JWT:", error);
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ msg: "Invalid JWT" }));
    }
  } else {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ msg: "No JWT provided" }));
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
