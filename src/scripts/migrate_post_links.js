#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");
const LINKS_PATH = path.join(ROOT, "src", "content", "post_links.json");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.endsWith(".md")) out.push(full);
    }
  }
  return out;
}

function readFrontmatter(md) {
  const m = String(md).match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return { fmText: "", fm: {}, bodyStart: 0 };
  const fmText = m[1];
  const fm = {};
  for (const line of fmText.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const raw = line.slice(idx + 1).trim();
    const value = raw.replace(/^"(.*)"$/, "$1");
    if (key) fm[key] = value;
  }
  return { fmText, fm, bodyStart: m[0].length };
}

function removeLinkLineFromFrontmatter(fmText) {
  const lines = String(fmText || "").split("\n");
  const out = [];
  for (const line of lines) {
    if (/^\s*link\s*:/i.test(line)) continue;
    out.push(line);
  }
  return out.join("\n");
}

function loadLinks() {
  if (!fs.existsSync(LINKS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(LINKS_PATH, "utf8")) || {};
  } catch {
    return {};
  }
}

function saveLinks(links) {
  fs.writeFileSync(LINKS_PATH, JSON.stringify(links, null, 2) + "\n", "utf8");
}

function main() {
  const links = loadLinks();
  let postsChanged = 0;
  let linksAdded = 0;

  for (const file of walk(POSTS_DIR)) {
    const raw = fs.readFileSync(file, "utf8");
    const { fmText, fm, bodyStart } = readFrontmatter(raw);
    if (!fmText) continue;

    const id = String(fm.id || "").trim();
    const link = String(fm.link || "").trim();
    if (id && link && !links[id]) {
      links[id] = link;
      linksAdded++;
    }

    if (/\n?\s*link\s*:/i.test(fmText)) {
      const nextFmText = removeLinkLineFromFrontmatter(fmText);
      const next = `---\n${nextFmText}\n---\n` + raw.slice(bodyStart);
      fs.writeFileSync(file, next, "utf8");
      postsChanged++;
    }
  }

  saveLinks(links);
  console.log(`Updated ${postsChanged} post(s), added ${linksAdded} link(s) to ${path.relative(ROOT, LINKS_PATH)}.`);
}

main();

