#!/usr/bin/env node
import fs from "fs";
import path from "path";
import slugify from "slugify";

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, "scripts/.post-index.json");

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) return {};
  return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
}

function saveIndex(index) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

function parseFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Invalid frontmatter");
  return {
    frontmatter: Object.fromEntries(
      match[1].split("\n").map(l => l.split(":").map(s => s.trim()))
    ),
    body: match[2]
  };
}

function resolveImage(id, name) {
  const dir = path.join(ROOT, "public/images/posts", id);
  const file = fs.readdirSync(dir).find(f => f.startsWith(name));
  if (!file) throw new Error(`Image not found: ${name}`);
  return file;
}

function transformBody(body, id) {
  let cover = null;

  const content = body.split("\n").map(line => {
    const imageMatch = line.match(/^image\s+(.+)$/);
    if (imageMatch) {
      const name = imageMatch[1];
      const file = resolveImage(id, name);
      if (!cover) cover = file;

      return `![${name}](/images/posts/${id}/${file})`;
    }

    if (/^https:\/\/www\.youtube\.com\/embed\//.test(line.trim())) {
      return `<iframe
  width="560"
  height="315"
  src="${line.trim()}"
  title="YouTube video"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>`;
    }

    return line;
  }).join("\n");

  return { content, cover };
}

function compile(sourcePath) {
  const raw = fs.readFileSync(sourcePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(raw);

  const index = loadIndex();
  const title = frontmatter.title;

  if (!index[title]) {
    const id = `${Object.keys(index).length}-${slugify(title, { lower: true })}`;
    index[title] = {
      id,
      date: new Date().toISOString().slice(0, 10)
    };
    saveIndex(index);
  }

  const { id, date } = index[title];
  const [year, month] = date.split("-");
  const pathname = `/${year}/${month}/${id}`;

  const { content, cover } = transformBody(body, id);

  const output = `---
id: "${id}"
pathname: "${pathname}"
title: "${title}"
date: "${date}"
tags:
${(frontmatter.tags || []).map(t => `  - ${t}`).join("\n")}
${cover ? `cover: ${cover}` : ""}
---

${content}
`;

  const outPath = path.join(ROOT, "src/content/posts", `${id}.md`);
  fs.writeFileSync(outPath, output);
  console.log(`Compiled → ${outPath}`);
}

compile(process.argv[2]);
