let api = null;
let apiRootEl = null;
const hookedJumpLinks = new WeakSet();
const HOME_TAGS_COOKIE = "home_tags";
const HOME_SCROLL_COOKIE = "home_scroll";
const HOME_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 14; // 14 days

function isHomePage() {
	return window.location.pathname === "/" || window.location.pathname === "";
}

function getCookie(name) {
	const needle = `${name}=`;
	const parts = String(document.cookie || "").split(";");
	for (const part of parts) {
		const trimmed = part.trim();
		if (trimmed.startsWith(needle)) {
			return decodeURIComponent(trimmed.slice(needle.length));
		}
	}
	return "";
}

function setCookie(name, value, maxAgeSeconds) {
	const maxAge = Number.isFinite(maxAgeSeconds) ? `; Max-Age=${maxAgeSeconds}` : "";
	document.cookie = `${name}=${encodeURIComponent(String(value || ""))}; Path=/${maxAge}; SameSite=Lax`;
}

function parseTagCookie(value) {
	return String(value || "")
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
}

function easeInOutCubic(t) {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollToY(targetY, durationMs = 650) {
	const startY = window.scrollY || 0;
	const delta = targetY - startY;
	if (Math.abs(delta) < 1) return;

	const start = performance.now();
	const tick = (now) => {
		const elapsed = now - start;
		const t = Math.min(1, elapsed / durationMs);
		const y = startY + delta * easeInOutCubic(t);
		window.scrollTo(0, y);
		if (t < 1) requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}

function smoothScrollToElement(el, durationMs = 650) {
	if (!el) return;
	const top = el.getBoundingClientRect().top + window.scrollY;
	smoothScrollToY(Math.max(0, top - 12), durationMs);
}

function initPostsFilter() {
	// DOM lookups MUST happen inside init
	const postListEl = document.getElementById("posts-list");
	if (!postListEl) {
		api = null;
		apiRootEl = null;
		return null;
	}

	if (api && apiRootEl === postListEl) return api;
	api = null;
	apiRootEl = postListEl;
	
	const tagButtons = Array.from(document.querySelectorAll(".filter-tag"));
	const allBtn = document.getElementById("tag-all");
	const postsCountEl = document.querySelector(".posts-count p");

	const currentSelectedTags = new Set();

	function getPostCards() {
		if (postListEl === null) return [];
		return Array.from(postListEl.querySelectorAll(".post-card"));
	}

	function updateButtonStates() {
		tagButtons.forEach((btn) => {
			const tag = btn.getAttribute("data-tag");
			if (tag) {
				btn.classList.toggle("active", currentSelectedTags.has(tag));
			} else if (btn.id === "tag-all") {
				btn.classList.toggle("active", currentSelectedTags.size === 0);
			}
		});
	}

	function renderPosts() {
		const cards = getPostCards();
		let visibleCount = 0;

		cards.forEach((card) => {
			const trueCard = card;
			const tags = (trueCard.dataset.tags || "")
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean);

			const matches =
				currentSelectedTags.size === 0 ||
				tags.some((t) => currentSelectedTags.has(t));

			trueCard.style.display = matches ? "" : "none";
			if (matches) visibleCount++;
		});

		if (postsCountEl) {
			postsCountEl.textContent = `Showing ${visibleCount} post${visibleCount !== 1 ? "s" : ""
				}`;
		}
	}

	function setSelectedTags(nextTags) {
		currentSelectedTags.clear();
		for (const tag of Array.isArray(nextTags) ? nextTags : []) {
			if (tag) currentSelectedTags.add(tag);
		}
		if (isHomePage()) {
			const tagsValue = Array.from(currentSelectedTags).join(",");
			setCookie(HOME_TAGS_COOKIE, tagsValue, HOME_COOKIE_MAX_AGE_S);
		}
		updateButtonStates();
		renderPosts();
	}

	// Event wiring
	if (allBtn) {
		allBtn.addEventListener("click", (e) => {
			e.preventDefault();
			setSelectedTags([]);
		});
	}

	tagButtons.forEach((btn) => {
		const tag = btn.getAttribute("data-tag");
		if (!tag) return;

		btn.addEventListener("click", (e) => {
			e.preventDefault();
			if (currentSelectedTags.has(tag)) {
				currentSelectedTags.delete(tag);
			} else {
				currentSelectedTags.add(tag);
			}
			updateButtonStates();
			renderPosts();
		});
	});

	// Initial render
	updateButtonStates();
	renderPosts();

	api = { setSelectedTags };
	return api;
}

function setSelectedTags(tags) {
	if (api) {
		api.setSelectedTags(tags);
		return;
	}
}

function bootHomePosts() {
	const postsSection = document.getElementById("posts");
	const postsApi = initPostsFilter();
	if (!postsApi || !postsSection) return;

	const isHome = isHomePage();
	try {
		const url = new URL(window.location.href);
		const tagParams = url.searchParams.getAll("tag");
		const tags = tagParams
			.flatMap((t) => String(t || "").split(","))
			.map((t) => t.trim())
			.filter(Boolean);
		if (tags.length) {
			postsApi.setSelectedTags(tags);
			smoothScrollToElement(postsSection, 650);
		} else if (isHome) {
			const savedTags = parseTagCookie(getCookie(HOME_TAGS_COOKIE));
			if (savedTags.length) postsApi.setSelectedTags(savedTags);
		}
	} catch {
		// ignore
	}

	const jumpLinks = Array.from(document.querySelectorAll("a[data-post-tag]"));

	jumpLinks.forEach((a) => {
		if (hookedJumpLinks.has(a)) return;
		hookedJumpLinks.add(a);

		const tag = a.dataset.postTag;
		if (!tag) return;

		a.addEventListener("click", (e) => {
			e.preventDefault();
			postsApi?.setSelectedTags([tag]);
			smoothScrollToElement(postsSection, 850);
		});
	});

	if (isHome) {
		let scrollTimer = null;
		const saveScroll = () => {
			if (scrollTimer) clearTimeout(scrollTimer);
			scrollTimer = setTimeout(() => {
				setCookie(HOME_SCROLL_COOKIE, String(window.scrollY || 0), HOME_COOKIE_MAX_AGE_S);
			}, 250);
		};
		window.addEventListener("scroll", saveScroll, { passive: true });

		const shouldRestore =
			!window.location.hash &&
			!new URL(window.location.href).searchParams.getAll("tag").length;
		if (shouldRestore) {
			const savedScroll = Number(getCookie(HOME_SCROLL_COOKIE) || 0);
			if (Number.isFinite(savedScroll) && savedScroll > 0) {
				requestAnimationFrame(() => {
					setTimeout(() => smoothScrollToY(savedScroll), 0);
				});
			}
		}
	}
}

if (typeof document !== "undefined") {
	document.addEventListener("astro:page-load", bootHomePosts);
	document.addEventListener("DOMContentLoaded", bootHomePosts);
	bootHomePosts();
}
