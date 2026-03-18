#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "images");
const DEST = path.join(ROOT, "public", "images");

function main() {
  if (!fs.existsSync(SRC)) return;

  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.cpSync(SRC, DEST, { recursive: true });
}

main();

