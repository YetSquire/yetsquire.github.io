const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const TOKEN_PATH = "token.json";

let authClient = null;
let oAuth2Client = null;

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

function uuidFromTabId(tabId) {
  const hash = crypto.createHash("sha256").update(`docs-tab:${String(tabId)}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC4122 variant
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stableHexId(input, length = 12) {
  const hex = crypto.createHash("sha256").update(String(input)).digest("hex");
  return hex.slice(0, length);
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

async function renderStructuralElementsToMarkdown({ elements, document, tab, postId }) {
  const {
    inlineObjects,
    inlineObjectsSource,
    positionedObjects,
    positionedObjectsSource
  } = resolveObjectMaps({ document, tab });
  const lists = document?.lists || {};
  const inlineIdToFilename = new Map();
  const positionedIdToFilename = new Map();
  const usedInlineObjectIds = [];
  const usedPositionedObjectIds = [];
  const richLinks = [];
  const links = [];
  const missingInlineObjectIds = [];
  const missingPositionedObjectIds = [];
  const images = [];

  const isMonospaceFont = (fontFamily) => {
    const ff = String(fontFamily || "").toLowerCase();
    return ff.includes("courier") || ff.includes("consolas") || ff.includes("menlo") || ff.includes("monaco") || ff.includes("monospace");
  };

  const splitTrailingNewlines = (s) => {
    const str = String(s || "");
    const m = str.match(/(\n+)$/);
    if (!m) return { text: str, suffix: "" };
    const suffix = m[1];
    return { text: str.slice(0, -suffix.length), suffix };
  };

  const renderTextRunToMarkdown = (textRun) => {
    const content = textRun?.content || "";
    const { text, suffix } = splitTrailingNewlines(content);
    if (!text) return suffix;

    const style = textRun?.textStyle || {};

    let inner = text;

    if (isMonospaceFont(style?.weightedFontFamily?.fontFamily)) {
      inner = "`" + inner.replace(/`/g, "\\`") + "`";
    } else {
      const bold = !!style.bold;
      const italic = !!style.italic;
      const strike = !!style.strikethrough;
      const underline = !!style.underline;

      if (bold && italic) inner = `***${inner}***`;
      else if (bold) inner = `**${inner}**`;
      else if (italic) inner = `_${inner}_`;

      if (strike) inner = `~~${inner}~~`;
      if (underline) inner = `<u>${inner}</u>`;
    }

    const url = style?.link?.url;
    if (url) {
      const label = String(inner).replace(/]/g, "\\]");
      inner = `[${label}](${url})`;
      links.push({ url, driveFileId: driveFileIdFromUri(url) });
    }

    return inner + suffix;
  };

  const paragraphPrefix = (paragraph) => {
    const named = paragraph?.paragraphStyle?.namedStyleType;
    if (named && /^HEADING_\d+$/.test(named)) {
      const level = Math.max(1, Math.min(6, Number(named.replace("HEADING_", ""))));
      return `${"#".repeat(level)} `;
    }
    if (named === "TITLE") return "# ";
    if (named === "SUBTITLE") return "## ";

    const bullet = paragraph?.bullet;
    if (bullet?.listId) {
      const nestingLevel = Number(bullet.nestingLevel || 0);
      const glyphType =
        lists?.[bullet.listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType || "";
      const ordered = /DECIMAL|ALPHA|ROMAN/i.test(String(glyphType));
      const indent = "  ".repeat(Math.max(0, nestingLevel));
      return indent + (ordered ? "1. " : "- ");
    }

    return "";
  };

  const toAltText = (embeddedObject) => {
    const alt = embeddedObject?.title || embeddedObject?.description || "image";
    return String(alt).replace(/\n/g, " ").trim() || "image";
  };

  const resolveEmbeddedImageMarkdown = async ({ key, map, embeddedObject }) => {
    if (!key) return "";
    if (map.has(key)) {
      const existing = map.get(key);
      return existing ? `![image](/images/posts/${postId}/${existing})` : "";
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
    return `![${alt}](/images/posts/${postId}/${filename})`;
  };

  const resolveInlineImageMarkdown = async (inlineObjectId) => {
    if (inlineObjectId) usedInlineObjectIds.push(inlineObjectId);
    const obj = inlineObjects?.[inlineObjectId];
    if (!obj && inlineObjectId) missingInlineObjectIds.push(inlineObjectId);
    const embedded = obj?.inlineObjectProperties?.embeddedObject;
    return resolveEmbeddedImageMarkdown({
      key: inlineObjectId,
      map: inlineIdToFilename,
      embeddedObject: embedded
    });
  };

  const resolvePositionedImageMarkdown = async (positionedObjectId) => {
    if (positionedObjectId) usedPositionedObjectIds.push(positionedObjectId);
    const obj = positionedObjects?.[positionedObjectId];
    if (!obj && positionedObjectId) missingPositionedObjectIds.push(positionedObjectId);
    const embedded = obj?.positionedObjectProperties?.embeddedObject;
    return resolveEmbeddedImageMarkdown({
      key: positionedObjectId,
      map: positionedIdToFilename,
      embeddedObject: embedded
    });
  };

  const out = [];

  const pushImageMarkdown = (md) => {
    if (!md) return;
    const last = out.length ? String(out[out.length - 1]) : "";
    if (last && !last.endsWith("\n")) out.push("\n");
    if (last && !last.endsWith("\n\n")) out.push("\n");
    out.push(md);
    out.push("\n\n");
  };

  const walk = async (els) => {
    if (!Array.isArray(els)) return;
    for (const el of els) {
      
      if (el?.paragraph) {
        out.push(paragraphPrefix(el.paragraph));
        for (const pe of el.paragraph.elements || []) {
          if (pe?.textRun) out.push(renderTextRunToMarkdown(pe.textRun));
          else if (pe?.inlineObjectElement?.inlineObjectId) {
            const md = await resolveInlineImageMarkdown(pe.inlineObjectElement.inlineObjectId);
            pushImageMarkdown(md);
          }
          else if (pe?.richLink?.richLinkProperties?.uri) {
            const props = pe.richLink.richLinkProperties;
            richLinks.push({
              title: props.title || null,
              uri: props.uri,
              mimeType: props.mimeType || null,
              driveFileId: driveFileIdFromUri(props.uri)
            });
          }
        }
        for (const positionedObjectId of el.paragraph.positionedObjectIds || []) {
          const md = await resolvePositionedImageMarkdown(positionedObjectId);
          pushImageMarkdown(md);
        }
        if (out.length && !String(out[out.length - 1]).endsWith("\n")) out.push("\n");
        continue;
      }
      if (el?.table) {
        for (const row of el.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            await walk(cell.content);
          }
        }
        continue;
      }
      if (el?.tableOfContents) {
        await walk(el.tableOfContents.content);
        continue;
      }
    }
  };

  await walk(elements);
  return {
    markdown: out.join(""),
    images,
    debug: {
      inlineObjectsSource,
      inlineObjectsCount: Object.keys(inlineObjects || {}).length,
      positionedObjectsSource,
      positionedObjectsCount: Object.keys(positionedObjects || {}).length,
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

// ----------------------------------------
// 2. OAuth redirect endpoint
// ----------------------------------------
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

    const postId = uuidFromTabId(tabId);
    const candidates = tabIdCandidates(tabId);
    const tab = tabs.find(t => candidates.includes(t?.tabProperties?.tabId));

    if (!tab) {
      return res.status(404).json({
        error: `Tab not found for tabId "${tabId}"`,
        details: candidates.length ? `Tried: ${candidates.join(", ")}` : undefined
      });
    }

    const content = tab?.documentTab?.body?.content;
    const rendered = await renderStructuralElementsToMarkdown({
      elements: content || [],
      document,
      tab,
      postId
    });
    const tabMarkdown = rendered.markdown;

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

    const extracted = extractRequiredMetaFromText(tabMarkdown);
    if (!extracted.ok) return res.status(400).json({ error: extracted.error });

    const postTitle = extracted.postTitle.trim();
    const postDate = extracted.postDate.trim();
    const postTags = extracted.postTags.map(t => t.trim()).filter(Boolean);

    const postDateISO = mmddyyyyToISO(postDate);
    let body = stripMetaHeaderLines(tabMarkdown);

    // Avoid rendering the same image twice (cover image is rendered separately by the site).
    // Only pick a cover if the first image appears near the top of the body, then remove its
    // first inline occurrence from the markdown.
    let cover = "";
    if (rendered.images.length) {
      const candidate = rendered.images[0];
      const src = `/images/posts/${postId}/${candidate}`;
      const imgRe = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(src)}\\)`);
      const idx = body.search(imgRe);
      if (idx >= 0 && idx < 500) {
        cover = candidate;
        body = body.replace(imgRe, "").replace(/^\s*\n/, "");
      }
    }

    const frontmatter = [
      "---",
      `id: "${postId}"`,
      `pathname: "/post/${postId}"`,
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

    const root = path.resolve(__dirname, "..");
    const outDir = path.join(root, "src", "content", "posts");
    const outPath = path.join(outDir, `${postId}.md`);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, postMarkdown, "utf8");

    res.json({
      ok: true,
      message: `Wrote post ${postId}`,
      postId,
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
      ...(debug ? { debug: rendered.debug } : {})
    });

  } catch (err) {
    console.error(err);
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
