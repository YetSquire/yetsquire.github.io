const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const slugify = require("slugify");

const app = express();

app.use(cors());
app.use(express.json());

const SCOPES = [
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/drive.readonly"
];
const TOKEN_PATH = "token.json";

let authClient = null;
let oAuth2Client = null;

function isInvalidGrantError(err) {
  const e = err?.response?.data?.error || err?.error || err?.message || "";
  return String(e).toLowerCase().includes("invalid_grant");
}

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

function stableHexId(input, length = 12) {
  const hex = crypto.createHash("sha256").update(String(input)).digest("hex");
  return hex.slice(0, length);
}

function slugFromTitle(title) {
  const slug = slugify(String(title || ""), {
    lower: true,
    strict: true,
    trim: true
  });
  return slug || "";
}

function scrubDocExportMetaHtml(html) {
  const raw = String(html || "");
  const headLimit = 12000;
  let head = raw.slice(0, headLimit);
  const tail = raw.slice(headLimit);

  const replaceFirst = (re, replacement) => {
    head = head.replace(re, replacement);
  };

  // Clean the metadata emitted by Docs export near the top of the document:
  // - Remove "Title: " (first occurrence)
  // - Remove "Date: " (first occurrence)
  // - Remove the tags section entirely
  replaceFirst(/Title:\s*/i, "");
  replaceFirst(/Date:\s*/i, "");

  // Tags can appear as a single line or a "Tags:" paragraph followed by a list.
  // Ensure we only remove a single <p> block (do not span across multiple paragraphs).
  replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bTags:\s*(?:(?!<\/p>)[\s\S])*?<\/p>\s*/i, "");
  replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bTags:\s*<\/p>\s*(<(ul|ol)\b[\s\S]*?<\/\2>\s*)/i, "");

  return head + tail;
}

function readYamlFrontmatter(text) {
  const m = String(text || "").match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const raw = line.slice(idx + 1).trim();
    const value = raw.replace(/^"(.*)"$/, "$1");
    if (key) fm[key] = value;
  }
  return fm;
}

function walkMarkdownFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && (ent.name.endsWith(".md") || ent.name.endsWith(".mdx"))) out.push(full);
    }
  }
  return out;
}

function slugIsTakenByOtherSource(postsDir, slug, sourceTabId) {
  if (!slug) return false;
  for (const filePath of walkMarkdownFiles(postsDir)) {
    const text = fs.readFileSync(filePath, "utf8");
    const fm = readYamlFrontmatter(text);
    const existingId = fm.id || path.basename(filePath).replace(/\.(md|mdx)$/, "");
    const existingSourceTabId = fm.sourceTabId || "";
    if (existingId === slug && String(existingSourceTabId) !== String(sourceTabId)) return true;
  }
  return false;
}

function isValidMMDDYYYY(mmddyyyy) {
  const m = String(mmddyyyy || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

function mmddyyyyToISO(mmddyyyy) {
  const m = String(mmddyyyy || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1]}-${m[2]}`;
}

function extractRequiredMetaFromText(text) {
  const raw = String(text || "").replace(/\u00a0/g, " ");
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const head = lines.slice(0, 200).join("\n");

  const titleMatches = [...head.matchAll(/^Title:\s*(.+)\s*$/gmi)].map(m => m[1].trim());
  const dateMatches = [...head.matchAll(/^Date:\s*(\d{2}\/\d{2}\/\d{4})\s*$/gmi)].map(m => m[1].trim());
  const tagsMatches = [...head.matchAll(/^Tags:\s*(.+)\s*$/gmi)].map(m => m[1].trim());

  if (titleMatches.length !== 1) return { ok: false, error: `Expected exactly one "Title: ..." line near the top (found ${titleMatches.length}).` };
  if (dateMatches.length !== 1) return { ok: false, error: `Expected exactly one "Date: mm/dd/yyyy" line near the top (found ${dateMatches.length}).` };
  if (tagsMatches.length !== 1) return { ok: false, error: `Expected exactly one "Tags: x, y, z" line near the top (found ${tagsMatches.length}).` };

  const postTitle = titleMatches[0];
  const postDate = dateMatches[0];
  const postTags = tagsMatches[0].split(",").map(t => t.trim()).filter(Boolean);

  if (!postTitle) return { ok: false, error: `"Title:" must not be empty.` };
  if (!isValidMMDDYYYY(postDate)) return { ok: false, error: `"Date:" must be a real date in mm/dd/yyyy (got "${postDate}").` };
  if (postTags.length === 0) return { ok: false, error: `"Tags:" must include at least one tag, comma-separated.` };

  return { ok: true, postTitle, postDate, postTags };
}

function stripMetaHeaderLines(text) {
  const lines = String(text || "").split(/\r?\n/);
  const removed = { title: false, date: false, tags: false };
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!removed.title && /^Title:\s*/i.test(trimmed)) {
      removed.title = true;
      continue;
    }
    if (!removed.date && /^Date:\s*/i.test(trimmed)) {
      removed.date = true;
      continue;
    }
    if (!removed.tags && /^Tags:\s*/i.test(trimmed)) {
      removed.tags = true;
      continue;
    }

    out.push(line);
  }

  return out.join("\n").trim();
}

function yamlList(items, indent = "  ") {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return `${indent}[]`;
  return list.map(i => `${indent}- ${String(i)}`).join("\n");
}

function guessImageExtension(contentType) {
  const ct = String(contentType || "").toLowerCase().split(";")[0].trim();
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/gif") return "gif";
  if (ct === "image/webp") return "webp";
  if (ct === "image/svg+xml") return "svg";
  return "png";
}

async function downloadImageToPostsFolder({ url, postId, nameBase }) {
  const root = path.resolve(__dirname, "..");
  const dir = path.join(root, "images", "posts", postId);
  fs.mkdirSync(dir, { recursive: true });

  let resp;
  try {
    resp = await authClient.request({
      url,
      method: "GET",
      responseType: "arraybuffer"
    });
  } catch (e) {
    throw httpError(
      400,
      "Failed to download an inline image from Google Docs.",
      e?.message || String(e)
    );
  }

  const ext = guessImageExtension(resp?.headers?.["content-type"]);
  const filename = `${nameBase}.${ext}`;
  const outPath = path.join(dir, filename);

  const buf = Buffer.isBuffer(resp.data) ? resp.data : Buffer.from(resp.data);
  fs.writeFileSync(outPath, buf);

  return filename;
}

function resolveObjectMaps({ document, tab }) {
  const inlineCandidates = [
    { source: "tab.documentTab.inlineObjects", map: tab?.documentTab?.inlineObjects },
    { source: "tab.inlineObjects", map: tab?.inlineObjects },
    { source: "document.inlineObjects", map: document?.inlineObjects }
  ];
  const positionedCandidates = [
    { source: "tab.documentTab.positionedObjects", map: tab?.documentTab?.positionedObjects },
    { source: "tab.positionedObjects", map: tab?.positionedObjects },
    { source: "document.positionedObjects", map: document?.positionedObjects }
  ];

  const pick = (cands) => {
    for (const c of cands) {
      if (c.map && typeof c.map === "object") return c;
    }
    return { source: "none", map: {} };
  };

  const inlinePicked = pick(inlineCandidates);
  const positionedPicked = pick(positionedCandidates);

  return {
    inlineObjects: inlinePicked.map || {},
    inlineObjectsSource: inlinePicked.source,
    positionedObjects: positionedPicked.map || {},
    positionedObjectsSource: positionedPicked.source
  };
}

function resolveListsMap({ document, tab }) {
  const candidates = [
    { source: "tab.documentTab.lists", map: tab?.documentTab?.lists },
    { source: "tab.lists", map: tab?.lists },
    { source: "document.lists", map: document?.lists }
  ];
  for (const c of candidates) {
    if (c.map && typeof c.map === "object") return { lists: c.map, listsSource: c.source };
  }
  return { lists: {}, listsSource: "none" };
}

function flattenTabs(tabs) {
  const out = [];
  const walk = (t) => {
    if (!t) return;
    const id = t?.tabProperties?.tabId || null;
    const title = t?.tabProperties?.title || null;
    out.push({ tabId: id, title });
    for (const child of t?.childTabs || []) walk(child);
  };
  for (const t of Array.isArray(tabs) ? tabs : []) walk(t);
  return out;
}

function extractBodyInnerHtml(html) {
  const raw = String(html || "");
  const m = raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : raw;
}

function extractHeadStyleHtml(html) {
  const raw = String(html || "");
  const head = raw.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const within = head ? head[1] : raw;
  const styles = [];
  const re = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
  let m;
  while ((m = re.exec(within)) !== null) styles.push(m[0]);
  return styles.join("\n");
}

function stripMetaHeaderFromExportHtml(bodyHtml) {
  // Best-effort: remove the first Title/Date/Tags paragraphs, regardless of styling.
  let html = String(bodyHtml || "");
  const patterns = [
    /<p\b[^>]*>\s*Title:\s*[\s\S]*?<\/p>/i,
    /<p\b[^>]*>\s*Date:\s*[\s\S]*?<\/p>/i,
    /<p\b[^>]*>\s*Tags:\s*[\s\S]*?<\/p>/i
  ];
  for (const p of patterns) html = html.replace(p, "");
  return html.trim();
}

async function exportTabHtmlViaDocs({ docId, tabId }) {
  // Prefer the native Google Docs HTML export endpoint (matches the UI export best).
  const candidates = tabIdCandidates(tabId);
  const base = `https://docs.google.com/document/d/${docId}/export`;

  let lastErr = null;
  for (const t of candidates.length ? candidates : [null]) {
    const url = t
      ? `${base}?format=html&tab=${encodeURIComponent(t)}`
      : `${base}?format=html`;
    try {
      const resp = await authClient.request({
        url,
        method: "GET",
        responseType: "text",
        headers: { Accept: "text/html" }
      });
      const html = String(resp?.data || "");
      if (html) return html;
    } catch (e) {
      lastErr = e;
    }
  }

  if (lastErr) {
    if (isInvalidGrantError(lastErr)) throw lastErr;
    throw httpError(
      400,
      "Failed to export Google Doc as HTML via docs.google.com export endpoint.",
      lastErr?.message || String(lastErr)
    );
  }

  throw httpError(400, "Failed to export Google Doc as HTML.", "No export candidates succeeded.");
}

function extractTabSectionFromExportHtml({ exportBodyHtml, targetTitle, allTitles }) {
  const body = String(exportBodyHtml || "");
  const target = String(targetTitle || "").trim();
  if (!target) return null;

  // Find first occurrence of each tab title (simple heuristic).
  const found = [];
  for (const t of allTitles || []) {
    const title = String(t || "").trim();
    if (!title) continue;
    const idx = body.indexOf(title);
    if (idx >= 0) found.push({ title, idx });
  }
  const targetEntry = found.find(f => f.title === target);
  if (!targetEntry) return null;

  found.sort((a, b) => a.idx - b.idx);
  const start = targetEntry.idx;
  const next = found.find(f => f.idx > start);
  const end = next ? next.idx : body.length;
  return body.slice(start, end).trim();
}

async function exportDocHtmlViaDrive(docId) {
  const drive = google.drive({ version: "v3", auth: authClient });
  try {
    const resp = await drive.files.export(
      { fileId: docId, mimeType: "text/html" },
      { responseType: "text" }
    );
    return String(resp?.data || "");
  } catch (e) {
    if (isInvalidGrantError(e)) throw e;
    throw httpError(
      400,
      "Failed to export Google Doc as HTML via Drive API.",
      e?.message || String(e)
    );
  }
}

async function rewriteAndDownloadImagesFromExportHtml({ html, postId }) {
  let out = String(html || "");
  const images = [];
  const srcToFilename = new Map();

  const imgTagRe = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  const seen = new Set();
  let match;

  while ((match = imgTagRe.exec(out)) !== null) {
    const src = match[1];
    if (!src) continue;
    if (src.startsWith(`/images/posts/${postId}/`)) continue;
    if (seen.has(src)) continue;
    seen.add(src);

    const nameBase = `img-${stableHexId(`export-img:${postId}:${src}`)}`;
    const filename = await downloadImageToPostsFolder({ url: src, postId, nameBase });
    images.push(filename);
    srcToFilename.set(src, filename);
  }

  // Rewrite src + ensure class.
  out = out.replace(imgTagRe, (full, src) => {
    if (!src) return full;
    if (src.startsWith(`/images/posts/${postId}/`)) return full;
    const file = srcToFilename.get(src);
    if (!file) return full;

    let tag = String(full);
    // rewrite src
    tag = tag.replace(/\bsrc=["'][^"']+["']/, `src="/images/posts/${postId}/${file}"`);
    // ensure class contains doc-image
    if (/\bclass=/.test(tag)) {
      tag = tag.replace(/\bclass=["']([^"']*)["']/, (m, cls) => {
        const classes = String(cls || "").split(/\s+/).filter(Boolean);
        if (!classes.includes("doc-image")) classes.push("doc-image");
        return `class="${classes.join(" ")}"`;
      });
    } else {
      tag = tag.replace(/^<img\b/, `<img class="doc-image"`);
    }
    return tag;
  });

  return { html: out, images };
}

async function renderStructuralElementsToHtml({ elements, document, tab, postId, stripMetaLines = false }) {
  const {
    inlineObjects,
    inlineObjectsSource,
    positionedObjects,
    positionedObjectsSource
  } = resolveObjectMaps({ document, tab });
  const { lists, listsSource } = resolveListsMap({ document, tab });
  const inlineIdToFilename = new Map();
  const positionedIdToFilename = new Map();
  const usedInlineObjectIds = [];
  const usedPositionedObjectIds = [];
  const richLinks = [];
  const links = [];
  const missingInlineObjectIds = [];
  const missingPositionedObjectIds = [];
  const images = [];

  const escapeHtml = (s) => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const preserveWhitespace = (s) => {
    // Docs text runs can contain tabs/spaces that should be visible in HTML.
    // - Tabs -> &emsp;
    // - Double spaces -> " &nbsp;" so sequences are preserved without affecting wrapping too much
    let out = String(s || "").replace(/\t/g, "&emsp;");
    out = out.replace(/  /g, " &nbsp;");
    return out;
  };

  const isMonospaceFont = (fontFamily) => {
    const ff = String(fontFamily || "").toLowerCase();
    return ff.includes("courier") || ff.includes("consolas") || ff.includes("menlo") || ff.includes("monaco") || ff.includes("monospace");
  };

  const renderTextRunToHtml = (textRun) => {
    const content = textRun?.content || "";
    if (!content) return "";

    const style = textRun?.textStyle || {};
    const url = style?.link?.url;

    let inner = preserveWhitespace(escapeHtml(content)).replace(/\n/g, "<br/>");

    // Inline code-ish formatting (heuristic).
    if (isMonospaceFont(style?.weightedFontFamily?.fontFamily)) {
      inner = `<code>${inner}</code>`;
    }

    if (style.bold) inner = `<strong>${inner}</strong>`;
    if (style.italic) inner = `<em>${inner}</em>`;
    if (style.underline) inner = `<u>${inner}</u>`;
    if (style.strikethrough) inner = `<s>${inner}</s>`;

    if (url) {
      links.push({ url, driveFileId: driveFileIdFromUri(url) });
      inner = `<a href="${escapeHtml(url)}">${inner}</a>`;
    }

    return inner;
  };

  const paragraphTag = (paragraph) => {
    const named = paragraph?.paragraphStyle?.namedStyleType;
    if (named && /^HEADING_\d+$/.test(named)) {
      const level = Math.max(1, Math.min(6, Number(named.replace("HEADING_", ""))));
      return `h${level}`;
    }
    if (named === "TITLE") return "h1";
    if (named === "SUBTITLE") return "h2";
    return "p";
  };

  const bulletInfo = (paragraph) => {
    const bullet = paragraph?.bullet;
    if (!bullet?.listId) return null;
    const nestingLevel = Number(bullet.nestingLevel || 0);
    const glyphType =
      lists?.[bullet.listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType || "";
    const ordered = /DECIMAL|ALPHA|ROMAN/i.test(String(glyphType));
    return { listId: bullet.listId, nestingLevel, ordered };
  };

  const toAltText = (embeddedObject) => {
    const alt = embeddedObject?.title || embeddedObject?.description || "image";
    return String(alt).replace(/\n/g, " ").trim() || "image";
  };

  const resolveEmbeddedImageHtml = async ({ key, map, embeddedObject }) => {
    if (!key) return "";
    if (map.has(key)) {
      const existing = map.get(key);
      return existing ? `<img class="doc-image" alt="image" src="/images/posts/${postId}/${existing}" />` : "";
    }

    const contentUri = embeddedObject?.imageProperties?.contentUri;
    if (!contentUri) {
      map.set(key, null);
      return "";
    }

    const nameBase = `img-${stableHexId(`docs-image:${postId}:${key}`)}`;
    const filename = await downloadImageToPostsFolder({ url: contentUri, postId, nameBase });
    map.set(key, filename);
    images.push(filename);

    const alt = toAltText(embeddedObject);
    const widthPx = dimensionToPx(embeddedObject?.size?.width);
    const widthAttr = widthPx ? ` width="${Math.round(widthPx)}"` : "";
    return `<img class="doc-image" alt="${alt.replace(/\"/g, "&quot;")}" src="/images/posts/${postId}/${filename}"${widthAttr} />`;
  };

  const resolveInlineImageHtml = async (inlineObjectId) => {
    if (inlineObjectId) usedInlineObjectIds.push(inlineObjectId);
    const obj = inlineObjects?.[inlineObjectId];
    if (!obj && inlineObjectId) missingInlineObjectIds.push(inlineObjectId);
    const embedded = obj?.inlineObjectProperties?.embeddedObject;
    return resolveEmbeddedImageHtml({
      key: inlineObjectId,
      map: inlineIdToFilename,
      embeddedObject: embedded
    });
  };

  const resolvePositionedImageHtml = async (positionedObjectId) => {
    if (positionedObjectId) usedPositionedObjectIds.push(positionedObjectId);
    const obj = positionedObjects?.[positionedObjectId];
    if (!obj && positionedObjectId) missingPositionedObjectIds.push(positionedObjectId);
    const embedded = obj?.positionedObjectProperties?.embeddedObject;
    return resolveEmbeddedImageHtml({
      key: positionedObjectId,
      map: positionedIdToFilename,
      embeddedObject: embedded
    });
  };

  const paragraphPlainText = (paragraph) => {
    return String(
      (paragraph?.elements || [])
        .map(pe => pe?.textRun?.content || "")
        .join("")
    ).trim();
  };

  const skipParagraphs = new WeakSet();
  if (stripMetaLines) {
    const removed = { title: false, date: false, tags: false };
    for (const el of elements || []) {
      const p = el?.paragraph;
      if (!p) continue;
      const t = paragraphPlainText(p);
      if (!removed.title && /^Title:\s*/i.test(t)) {
        removed.title = true;
        skipParagraphs.add(p);
        continue;
      }
      if (!removed.date && /^Date:\s*/i.test(t)) {
        removed.date = true;
        skipParagraphs.add(p);
        continue;
      }
      if (!removed.tags && /^Tags:\s*/i.test(t)) {
        removed.tags = true;
        skipParagraphs.add(p);
        continue;
      }
    }
  }

  const renderElements = async (els) => {
    if (!Array.isArray(els)) return "";

    let html = "";
    const listStack = []; // entries: { listId, ordered }

    const closeListsTo = (depth) => {
      while (listStack.length > depth) {
        const last = listStack.pop();
        html += last?.ordered ? "</ol>" : "</ul>";
      }
    };

    const openList = (ordered) => {
      html += ordered ? "<ol>" : "<ul>";
      listStack.push({ ordered });
    };

    const ensureListDepth = (targetDepth, orderedAtDepth) => {
      // Close if we're deeper than needed
      closeListsTo(targetDepth);
      // Open until we reach targetDepth
      while (listStack.length < targetDepth) {
        const ordered = orderedAtDepth?.[listStack.length] || false;
        openList(ordered);
      }
    };

    for (const el of els) {
      if (el?.paragraph) {
        const p = el.paragraph;
        if (skipParagraphs.has(p)) continue;

        const bi = bulletInfo(p);
        if (bi) {
          // Nested lists: depth = nestingLevel + 1
          const targetDepth = Math.max(0, bi.nestingLevel) + 1;
          const orderedByDepth = [];
          orderedByDepth[targetDepth - 1] = !!bi.ordered;
          ensureListDepth(targetDepth, orderedByDepth);

          let liInner = "";
          for (const pe of p.elements || []) {
            if (pe?.textRun) liInner += renderTextRunToHtml(pe.textRun);
            else if (pe?.inlineObjectElement?.inlineObjectId) {
              const img = await resolveInlineImageHtml(pe.inlineObjectElement.inlineObjectId);
              if (img) liInner += `<figure>${img}</figure>`;
            } else if (pe?.richLink?.richLinkProperties?.uri) {
              const props = pe.richLink.richLinkProperties;
              richLinks.push({
                title: props.title || null,
                uri: props.uri,
                mimeType: props.mimeType || null,
                driveFileId: driveFileIdFromUri(props.uri)
              });
            }
          }
          for (const positionedObjectId of p.positionedObjectIds || []) {
            const img = await resolvePositionedImageHtml(positionedObjectId);
            if (img) liInner += `<figure>${img}</figure>`;
          }

          html += `<li>${liInner.trim()}</li>`;
          continue;
        }

        // Non-list paragraph: close any open lists first.
        closeListsTo(0);

        const tag = paragraphTag(p);
        let inner = "";
        for (const pe of p.elements || []) {
          if (pe?.textRun) inner += renderTextRunToHtml(pe.textRun);
          else if (pe?.inlineObjectElement?.inlineObjectId) {
            const img = await resolveInlineImageHtml(pe.inlineObjectElement.inlineObjectId);
            if (img) inner += `<figure>${img}</figure>`;
          } else if (pe?.richLink?.richLinkProperties?.uri) {
            const props = pe.richLink.richLinkProperties;
            richLinks.push({
              title: props.title || null,
              uri: props.uri,
              mimeType: props.mimeType || null,
              driveFileId: driveFileIdFromUri(props.uri)
            });
          }
        }
        for (const positionedObjectId of p.positionedObjectIds || []) {
          const img = await resolvePositionedImageHtml(positionedObjectId);
          if (img) inner += `<figure>${img}</figure>`;
        }

        const trimmed = inner.trim();
        if (trimmed) html += `<${tag}>${trimmed}</${tag}>`;
        continue;
      }

      if (el?.table) {
        // Close lists before tables
        closeListsTo(0);
        html += "<table><tbody>";
        for (const row of el.table.tableRows || []) {
          html += "<tr>";
          for (const cell of row.tableCells || []) {
            const cellHtml = await renderElements(cell.content || []);
            html += `<td>${cellHtml}</td>`;
          }
          html += "</tr>";
        }
        html += "</tbody></table>";
        continue;
      }

      if (el?.tableOfContents) {
        closeListsTo(0);
        const tocHtml = await renderElements(el.tableOfContents.content || []);
        html += `<nav class="doc-toc">${tocHtml}</nav>`;
        continue;
      }
    }

    closeListsTo(0);
    return html;
  };

  const html = await renderElements(elements);
  return {
    html,
    images,
    debug: {
      inlineObjectsSource,
      inlineObjectsCount: Object.keys(inlineObjects || {}).length,
      positionedObjectsSource,
      positionedObjectsCount: Object.keys(positionedObjects || {}).length,
      listsSource,
      listsCount: Object.keys(lists || {}).length,
      usedInlineObjectIds,
      usedPositionedObjectIds,
      missingInlineObjectIds: uniqueStrings(missingInlineObjectIds),
      missingPositionedObjectIds: uniqueStrings(missingPositionedObjectIds),
      richLinks,
      links
    }
  };
}

function collectTextFromStructuralElements(elements) {
  const out = [];

  const pushParagraphText = (paragraph) => {
    const text = paragraph?.elements?.map(e => e?.textRun?.content || "").join("") || "";
    if (!text) return;
    out.push(text);
    if (!text.endsWith("\n")) out.push("\n");
  };

  const walk = (els) => {
    if (!Array.isArray(els)) return;
    for (const el of els) {
      if (el?.paragraph) {
        pushParagraphText(el.paragraph);
        continue;
      }
      if (el?.table) {
        for (const row of el.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            walk(cell.content);
          }
        }
        continue;
      }
      if (el?.tableOfContents) {
        walk(el.tableOfContents.content);
        continue;
      }
    }
  };

  walk(elements);
  return out.join("");
}

function uniqueStrings(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const s = item.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function tabIdCandidates(tabId) {
  const raw = String(tabId || "").trim();
  if (!raw) return [];
  const candidates = [raw];
  if (raw.startsWith("t.")) candidates.push(raw.slice(2));
  else candidates.push(`t.${raw}`);
  return uniqueStrings(candidates);
}

function driveFileIdFromUri(uri) {
  const u = String(uri || "");
  let m = u.match(/\/file\/d\/([^/?#]+)/);
  if (m) return m[1];
  m = u.match(/[?&]id=([^&#]+)/);
  if (m) return m[1];
  return null;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dimensionToPx(dim) {
  const magnitude = Number(dim?.magnitude);
  if (!Number.isFinite(magnitude) || magnitude <= 0) return null;
  const unit = String(dim?.unit || "").toUpperCase();
  if (unit === "PT") return magnitude * (4 / 3);
  if (unit === "PX") return magnitude;
  return null;
}

// ----------------------------------------
// 1. Create OAuth2 client
// ----------------------------------------
function createOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync("credentials.json"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0] // redirect_uri = "http://localhost:3001/oauth2callback"
  );

  // Try to load existing token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    authClient = oAuth2Client;
    console.log("Using saved token.json");
  }
}

createOAuthClient();

function getAuthUrl() {
  if (!oAuth2Client) return null;
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });
}

// ----------------------------------------
// 2. OAuth redirect endpoint
// ----------------------------------------
app.get("/auth", (req, res) => {
  const url = getAuthUrl();
  if (!url) return res.status(500).send("OAuth client not initialized.");
  // Convenience: redirect in browser, but also usable as JSON.
  if (String(req.query.json || "") === "1") return res.json({ authUrl: url });
  return res.redirect(url);
});

app.get("/auth/status", (req, res) => {
  res.json({
    ok: true,
    oauthReady: !!oAuth2Client,
    tokenFileExists: fs.existsSync(TOKEN_PATH),
    authed: !!authClient,
    authUrl: getAuthUrl()
  });
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code received from Google.");

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    authClient = oAuth2Client;
    res.send("Authorization complete! You can close this tab.");
    console.log("OAuth token saved.");
  } catch (err) {
    console.error("Error getting token:", err);
    res.status(500).send("Failed to retrieve token.");
  }
});

// ----------------------------------------
// 3. Your compile endpoint
// ----------------------------------------
app.post("/compile", async (req, res) => {
  try {
    if (!authClient) return res.status(500).json({ error: "Google OAuth not ready" });

    const { docId, tabId, debug } = req.body || {};
    if (!docId || typeof docId !== "string") return res.status(400).json({ error: "Missing required docId" });
    if (!tabId || typeof tabId !== "string") return res.status(400).json({ error: "Missing required tabId" });

    const docs = google.docs({ version: "v1", auth: authClient });
    const response = await docs.documents.get({ documentId: docId, includeTabsContent: true });

    const document = response.data;
    const tabs = Array.isArray(document?.tabs) ? document.tabs : [];
    if (tabs.length === 0) {
      return res.status(400).json({
        error: "This document has no tabs in the Docs API response.",
        details: "Open a Google Doc with tabs enabled, or update the compiler to support non-tab documents."
      });
    }

    const candidates = tabIdCandidates(tabId);
    const tab = tabs.find(t => candidates.includes(t?.tabProperties?.tabId));

    if (!tab) {
      return res.status(404).json({
        error: `Tab not found for tabId "${tabId}"`,
        details: candidates.length ? `Tried: ${candidates.join(", ")}` : undefined
      });
    }

    const content = tab?.documentTab?.body?.content;
    const tabPlainText = collectTextFromStructuralElements(content || []);
    const tabTitle = tab?.tabProperties?.title || "";
    const allTabTitles = flattenTabs(tabs).map(t => t.title).filter(Boolean);

    const extracted = extractRequiredMetaFromText(tabPlainText);
    if (!extracted.ok) return res.status(400).json({ error: extracted.error });

    const postTitle = extracted.postTitle.trim();
    const postDate = extracted.postDate.trim();
    const postTags = extracted.postTags.map(t => t.trim()).filter(Boolean);

    const root = path.resolve(__dirname, "..");
    const outDir = path.join(root, "src", "content", "posts");

    const baseSlug = slugFromTitle(postTitle) || stableHexId(`${docId}:${tabId}`, 12);
    const slug = slugIsTakenByOtherSource(outDir, baseSlug, tabId)
      ? `${baseSlug}-${stableHexId(`${docId}:${tabId}`, 6)}`
      : baseSlug;
    const postId = slug;

    let renderMode = "docs_export_html";
    let rendered = null;
    let tabHtml = "";
    let exportedDebug = null;

    try {
      // 1) Best: use native docs.google.com export endpoint (preserves lists/tabs exactly).
      const exported = await exportTabHtmlViaDocs({ docId, tabId });
      const styleHtml = extractHeadStyleHtml(exported);
      const exportBody = extractBodyInnerHtml(exported);
      const rewritten = await rewriteAndDownloadImagesFromExportHtml({ html: exportBody, postId });
      tabHtml = `${styleHtml ? styleHtml + "\n" : ""}<div class="doc-export">${rewritten.html}</div>`;
      rendered = { images: rewritten.images, debug: { inlineObjectsCount: 0, positionedObjectsCount: 0, usedInlineObjectIds: [], usedPositionedObjectIds: [], richLinks: [], links: [] } };
      exportedDebug = { exportedVia: "docs", tabId, tabTitle };
    } catch (e) {
      // 2) Next-best: Drive export (full doc), then attempt tab extraction (heuristic).
      try {
        renderMode = "drive_export_html";
        const exported = await exportDocHtmlViaDrive(docId);
        const styleHtml = extractHeadStyleHtml(exported);
        const exportBody = extractBodyInnerHtml(exported);
        const extracted = extractTabSectionFromExportHtml({
          exportBodyHtml: exportBody,
          targetTitle: tabTitle,
          allTitles: allTabTitles
        });
        if (!extracted) throw httpError(400, "Could not locate tab within exported HTML.", "Falling back to Docs API renderer.");
        const rewritten = await rewriteAndDownloadImagesFromExportHtml({ html: extracted, postId });
        tabHtml = `${styleHtml ? styleHtml + "\n" : ""}<div class="doc-export">${rewritten.html}</div>`;
        rendered = { images: rewritten.images, debug: { inlineObjectsCount: 0, positionedObjectsCount: 0, usedInlineObjectIds: [], usedPositionedObjectIds: [], richLinks: [], links: [] } };
        exportedDebug = { exportedVia: "drive", extracted: true, tabTitle, titlesFound: allTabTitles.length };
      } catch (e2) {
        // 3) Fallback: Docs API structural render.
        renderMode = "docs_api_html_fallback";
        rendered = await renderStructuralElementsToHtml({
          elements: content || [],
          document,
          tab,
          postId,
          stripMetaLines: true
        });
        tabHtml = `<div class="doc-export">${rendered.html}</div>`;
        exportedDebug = { exportedVia: "none", error: e2?.message || e?.message || String(e2 || e) };
      }
    }

    const warnings = [];
    if (rendered.images.length === 0) {
      const richLinks = Array.isArray(rendered?.debug?.richLinks) ? rendered.debug.richLinks : [];
      const driveish = richLinks.filter(r => r?.driveFileId || /drive\.google\.com/.test(String(r?.uri || "")));
      if (driveish.length) {
        warnings.push(
          "Found Google Drive rich links (file chips) but no embedded images. Linked Drive files are not Docs inline images, so they will not be downloaded; insert the image into the doc (Insert → Image) instead of linking it."
        );
      }
    }
    if ((rendered?.debug?.inlineObjectsCount || 0) > 0 && (rendered?.debug?.usedInlineObjectIds || []).length === 0) {
      warnings.push("Docs API returned inlineObjects, but none were referenced from the tab body content we walked.");
    }
    if ((rendered?.debug?.usedInlineObjectIds || []).length > 0 && (rendered?.debug?.missingInlineObjectIds || []).length > 0) {
      warnings.push(
        "Tab body referenced inlineObjectIds that were not present in the inlineObjects map returned by the Docs API response. Try recompiling; if it persists, the Docs API response may be omitting inlineObjects for this tab."
      );
    }

    const postDateISO = mmddyyyyToISO(postDate);
    let body = String(tabHtml || "").trim();

    const pathname = `/post/${postId}`;

    // Avoid rendering the same image twice (cover image is rendered separately by the site).
    // Only pick a cover if the first image appears near the top of the body, then remove its
    // first inline occurrence from the markdown.
    let cover = "";
    if (rendered.images.length) {
      const candidate = rendered.images[0];
      const src = `/images/posts/${postId}/${candidate}`;
      const htmlFigureRe = new RegExp(`<figure>\\s*<img[^>]*\\ssrc=["']${escapeRegExp(src)}["'][^>]*>\\s*<\\/figure>`, "i");
      const htmlImgRe = new RegExp(`<img[^>]*\\ssrc=["']${escapeRegExp(src)}["'][^>]*>`, "i");
      const figIdx = body.search(htmlFigureRe);
      const imgIdx = body.search(htmlImgRe);
      const idx = (figIdx >= 0 && imgIdx >= 0) ? Math.min(figIdx, imgIdx) : Math.max(figIdx, imgIdx);
      if (idx >= 0 && idx < 1200) {
        cover = candidate;
        if (figIdx === idx) body = body.replace(htmlFigureRe, "");
        else body = body.replace(htmlImgRe, "");
        body = body.replace(/^\s*\n/, "");
      }
    }

    body = scrubDocExportMetaHtml(body);

    const frontmatter = [
      "---",
      `id: "${postId}"`,
      `pathname: "${pathname}"`,
      `sourceDocId: "${docId}"`,
      `sourceTabId: "${tabId}"`,
      `title: "${postTitle.replace(/\"/g, '\\"')}"`,
      `date: "${postDateISO}"`,
      "tags:",
      yamlList(postTags, "  "),
      ...(cover ? [`cover: ${cover}`] : []),
      ...(rendered.images.length ? ["images:", yamlList(rendered.images, "  ")] : []),
      "---"
    ].join("\n");

    const postMarkdown = `${frontmatter}\n\n${body}\n`;

    const outPath = path.join(outDir, `${postId}.md`);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, postMarkdown, "utf8");

    res.json({
      ok: true,
      message: `Wrote post ${postId}`,
      postId,
      pathname,
      outPath,
      postTitle,
      postDate,
      postDateISO,
      postTags,
      resolvedTabId: tab?.tabProperties?.tabId,
      cover: cover || null,
      images: rendered.images,
      warnings,
      body,
      postMarkdown,
      ...(debug ? { debug: { renderMode, exportedDebug, ...(rendered.debug || {}) } } : {})
    });

  } catch (err) {
    console.error(err);
    if (isInvalidGrantError(err)) {
      // Refresh token expired/revoked; user must re-authorize.
      authClient = null;
      return res.status(401).json({
        error: "Google OAuth token expired or was revoked (invalid_grant). Re-authorize and try again.",
        details: "Open http://localhost:3001/auth to re-authorize, then retry compile. If it still fails, delete compiler/token.json and re-authorize again.",
        authUrl: getAuthUrl()
      });
    }
    const status = Number(err?.status) || 500;
    res.status(status).json({
      error: status === 500 ? `compile failed: ${err?.message || String(err)}` : (err?.message || "compile failed"),
      details: err?.details || err?.stack || String(err)
    });
  }
});

// ----------------------------------------
// 4. Start server
// ----------------------------------------
app.listen(3001, () => {
  console.log("Compile server running on http://localhost:3001");
});
