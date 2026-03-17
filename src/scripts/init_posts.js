let api = null;
const hookedJumpLinks = new WeakSet();

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
	if (api) return api;

	// DOM lookups MUST happen inside init
	const postListEl = document.getElementById("posts-list");
	if (!postListEl) return null;
	
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
	const postsList = document.getElementById("posts-list");
	if (!postsList) {
		requestAnimationFrame(bootHomePosts);
		return;
	}

	const postsSection = document.getElementById("posts");
	const postsApi = initPostsFilter();

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
}

if (typeof document !== "undefined") {
	document.addEventListener("astro:page-load", bootHomePosts);
	document.addEventListener("DOMContentLoaded", bootHomePosts);
	bootHomePosts();
}
