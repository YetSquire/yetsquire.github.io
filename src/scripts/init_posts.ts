// Extract selected tags from the current URL (client-side)
function getInitialSelectedTagsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.getAll("tags");
}

export function initPostsFilter() {
  // DOM lookups MUST happen inside init
  const postListEl = document.getElementById("posts-list");
  if (!postListEl) return;

  const tagButtons = Array.from(document.querySelectorAll(".filter-tag"));
  const allBtn = document.getElementById("tag-all");
  const postsCountEl = document.querySelector(".posts-count p");

  const initialSelectedTags = getInitialSelectedTagsFromUrl();
  const currentSelectedTags = new Set(initialSelectedTags);

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

  function renderPosts(updateUrl = true) {
    const cards = getPostCards();
    let visibleCount = 0;

    cards.forEach((card) => {
	  const trueCard = card as HTMLElement;
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
      postsCountEl.textContent = `Showing ${visibleCount} post${
        visibleCount !== 1 ? "s" : ""
      }`;
    }

    if (updateUrl) {
      const queryParams = Array.from(currentSelectedTags)
        .map((t) => `tags=${encodeURIComponent(t)}`)
        .join("&");

      const newUrl = queryParams ? `/posts?${queryParams}` : "/posts";
      window.history.replaceState(null, "", newUrl);
    }
  }

  // Event wiring
  if (allBtn) {
    allBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentSelectedTags.clear();
      updateButtonStates();
      renderPosts(true);
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
      renderPosts(true);
    });
  });

  // Initial render
  updateButtonStates();
  renderPosts(false);
}
