import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 3000;
const directory = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(directory, { dotfiles: "ignore" }));

app.listen(port, "127.0.0.1", () => {
  console.log(`FocusFlow is running at http://localhost:${port}`);
});
