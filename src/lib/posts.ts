import fs from "node:fs";
import path from "node:path";

export type LoadedPost = {
	id: string;
	pathname: string;
	title: string;
	description: string;
	date: string;
	tags: string[];
	cover: string;
	images: string[];
	videos: string[];
	externalUrl: string;
	html: string;
	sourceDocId?: string;
	sourceTabId?: string;
};

const POSTS_DIR = path.resolve(process.cwd(), "src", "content", "posts");

const decodeHtmlEntities = (value: string): string =>
	String(value || "")
		.replace(/&nbsp;|&#160;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&rsquo;|&lsquo;/gi, "'")
		.replace(/&rdquo;|&ldquo;/gi, '"');

const stripHtml = (value: string): string =>
	String(value || "").replace(/<[^>]*>/g, " ");

const normalizeWhitespace = (value: string): string =>
	String(value || "")
		.replace(/\s+/g, " ")
		.trim();

const normalizeExportParagraphText = (value: string): string =>
	normalizeWhitespace(decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, " ")));

const walkFiles = (dir: string): string[] => {
	if (!fs.existsSync(dir)) return [];
	const out: string[] = [];
	const stack = [dir];
	while (stack.length) {
		const current = stack.pop();
		if (!current) continue;
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) stack.push(full);
			else if (entry.isFile()) out.push(full);
		}
	}
	return out;
};

const routeImagePath = (postId: string, imagePath: string): string => {
	if (!imagePath) return "";
	if (imagePath.startsWith("/") || imagePath.startsWith("http")) return imagePath;
	return `/images/posts/${postId}/${imagePath}`;
};

const scrubDocExportMetaHtml = (html: string): string => {
	const raw = String(html || "");
	let out = raw;

	const replaceFirst = (pattern: RegExp, replacement: string) => {
		out = out.replace(pattern, replacement);
	};

	replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bTitle:\s*(?:(?!<\/p>)[\s\S])*?<\/p>\s*/i, "");
	replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bDate:\s*(?:(?!<\/p>)[\s\S])*?<\/p>\s*/i, "");
	replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bLink:\s*(?:(?!<\/p>)[\s\S])*?<\/p>\s*/i, "");
	replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bTags:\s*(?:(?!<\/p>)[\s\S])*?<\/p>\s*/i, "");
	replaceFirst(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?\bTags:\s*<\/p>\s*(<(ul|ol)\b[\s\S]*?<\/\2>\s*)/i, "");

	return out;
};

const stripLeadingEmptyExportBlocks = (html: string): string => {
	let out = String(html || "").trimStart();
	const patterns = [
		/^\s*<div>\s*<p\b[^>]*>[\s\S]*?<\/p>\s*<\/div>\s*/i,
		/^\s*<p\b[^>]*>[\s\S]*?<\/p>\s*/i,
	];

	let removed = 0;
	while (removed < 8) {
		let changed = false;
		for (const pattern of patterns) {
			const match = out.match(pattern);
			if (!match) continue;
			const text = normalizeExportParagraphText(match[0]);
			if (text) continue;
			out = out.slice(match[0].length).trimStart();
			removed += 1;
			changed = true;
			break;
		}
		if (!changed) break;
	}

	return out.trim();
};

const stripMatchingMetadataLinkFromBody = (text: string, postLink: string): string => {
	const link = String(postLink || "").trim();
	if (!link) return String(text || "");

	const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const encodedLink = encodeURIComponent(link);
	const escapedEncodedLink = encodedLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const googleQValue = `(?:${escapedEncodedLink}|${escapedLink})`;
	const patterns = [
		new RegExp(`^\\s*${escapedLink}\\s*$`, "mi"),
		new RegExp(
			`<p\\b[^>]*>\\s*(?:<span\\b[^>]*>)?\\s*<a\\b[^>]*href=["'][^"']*${escapedLink}[^"']*["'][^>]*>\\s*${escapedLink}\\s*<\\/a>\\s*(?:<\\/span>)?\\s*<\\/p>`,
			"i",
		),
		new RegExp(
			`<p\\b[^>]*>[\\s\\S]*?<a\\b[^>]*href=["']https:\\/\\/www\\.google\\.com\\/url\\?q=${googleQValue}(?:&|&amp;|["'])[\\s\\S]*?>\\s*${escapedLink}\\s*<\\/a>[\\s\\S]*?<\\/p>`,
			"i",
		),
	];

	let out = String(text || "");
	for (const pattern of patterns) out = out.replace(pattern, "");
	return out.trim();
};

const cleanPostHtml = (html: string, postLink: string): string =>
	stripLeadingEmptyExportBlocks(
		stripMatchingMetadataLinkFromBody(scrubDocExportMetaHtml(String(html || "")), postLink),
	).trim();

export const extractExcerptFromHtml = (html: string, title: string): string => {
	const source = String(html || "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
	if (!source) return "";

	const titleLower = String(title || "").trim().toLowerCase();
	const pMatches = Array.from(source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi));
	for (const match of pMatches) {
		const text = normalizeWhitespace(decodeHtmlEntities(stripHtml(match[1] || "")));
		if (!text) continue;
		if (titleLower && text.toLowerCase() === titleLower) continue;
		if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(text)) continue;
		if (/^\d{4}-\d{2}-\d{2}$/.test(text)) continue;
		if (/^(tags|link):/i.test(text)) continue;
		if (text.length < 25 && !/[.!?]/.test(text)) continue;
		return text;
	}

	const fallback = normalizeWhitespace(decodeHtmlEntities(stripHtml(source)));
	return fallback.length >= 25 ? fallback : "";
};

const normalizePostRecord = (
	meta: Record<string, unknown>,
	bodyHtml: string,
	postLinks: Record<string, string>,
	fallbackId: string,
): LoadedPost => {
	const id = String(meta.id || fallbackId);
	const coverSource = String(meta.cover || meta.image || "");
	const imagesSource = Array.isArray(meta.images)
		? meta.images
		: meta.images
			? [meta.images]
			: [];
	const videosSource = Array.isArray(meta.videos)
		? meta.videos
		: meta.videos
			? [meta.videos]
			: [];
	const images = imagesSource
		.map((value) => routeImagePath(id, String(value || "")))
		.filter(Boolean);
	const cover = coverSource ? routeImagePath(id, coverSource) : "";
	const html = cleanPostHtml(bodyHtml, String(postLinks?.[id] || ""));

	return {
		id,
		pathname: String(meta.pathname || `/post/${id}`),
		title: String(meta.title || id),
		description: String(meta.description || ""),
		date: String(meta.date || "1970-01-01"),
		tags: Array.isArray(meta.tags) ? meta.tags.map((tag) => String(tag)) : [],
		cover,
		images,
		videos: videosSource.map((value) => String(value || "")).filter(Boolean),
		externalUrl: typeof postLinks?.[id] === "string" ? postLinks[id].trim() : "",
		html,
		sourceDocId: typeof meta.sourceDocId === "string" ? meta.sourceDocId : undefined,
		sourceTabId: typeof meta.sourceTabId === "string" ? meta.sourceTabId : undefined,
	};
};

export const loadGeneratedPosts = (
	postLinks: Record<string, string> = {},
): LoadedPost[] => {
	const files = walkFiles(POSTS_DIR);
	const posts = new Map<string, LoadedPost>();

	for (const jsonPath of files.filter((file) => file.endsWith(".json"))) {
		const raw = fs.readFileSync(jsonPath, "utf8");
		const meta = JSON.parse(raw) as Record<string, unknown>;
		const fallbackId = path.basename(jsonPath, ".json");
		const htmlPath = jsonPath.replace(/\.json$/, ".html");
		const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";
		const post = normalizePostRecord(meta, html, postLinks, fallbackId);
		posts.set(post.id, post);
	}

	return Array.from(posts.values());
};
