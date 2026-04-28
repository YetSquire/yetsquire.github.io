#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");

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

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseFrontmatter(md) {
  const m = String(md).match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return { fm: {}, bodyStart: 0 };
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
  return { fm, bodyStart: m[0].length };
}

function stripDocExportLinkParagraphs(body, postLink) {
  let out = String(body || "");

  // Remove any explicit "Link:" paragraph in exported HTML (style-agnostic).
  out = out.replace(/<p\b[^>]*>\s*Link:\s*[\s\S]*?<\/p>\s*/gi, "");

  const link = String(postLink || "").trim();
  if (!link) return out;

  const escapedLink = escapeRegExp(link);
  const encodedLink = encodeURIComponent(link);

  // Remove the "naked URL" paragraph (even if anchor href is google.com/url?q=...).
  out = out.replace(
    new RegExp(
      `<p\\b[^>]*>[\\s\\S]*?<a\\b[^>]*href=["'](?:https:\\/\\/www\\.google\\.com\\/url\\?q=(?:${escapeRegExp(encodedLink)}|${escapedLink})[\\s\\S]*?|[^"']*${escapedLink}[^"']*)["'][\\s\\S]*?>\\s*${escapedLink}\\s*<\\/a>[\\s\\S]*?<\\/p>\\s*`,
      "i"
    ),
    ""
  );

  return out;
}

function main() {
  const files = walk(POSTS_DIR);
  let changed = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const { fm, bodyStart } = parseFrontmatter(raw);
    const link = fm.link || "";
    const body = raw.slice(bodyStart);
    const cleanedBody = stripDocExportLinkParagraphs(body, link);
    if (cleanedBody !== body) {
      fs.writeFileSync(file, raw.slice(0, bodyStart) + cleanedBody, "utf8");
      changed++;
    }
  }

  console.log(`Cleaned ${changed} post(s).`);
}

main();

