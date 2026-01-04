// Extract selected tags from the current URL (client-side)
function getInitialSelectedTagsFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.getAll("tags");
}


export function initPostsFilter() {
  const tryInit = () => {
    const postListEl = document.getElementById("posts-list");
    if (!postListEl) {
      return false;
    }

    const tagButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".filter-tag")
    );
    const allBtn = document.getElementById("tag-all");
    const postsCountEl = document.querySelector(".posts-count p");

    const initialSelectedTags = getInitialSelectedTagsFromUrl();
    const currentSelectedTags = new Set(initialSelectedTags);

    function getPostCards() {
      return Array.from(
        (postListEl as HTMLElement).querySelectorAll<HTMLElement>(".post-card")
      );
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
      let visibleCount = 0;

      getPostCards().forEach((card) => {
        const tags = (card.dataset.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const matches =
          currentSelectedTags.size === 0 ||
          tags.some((t) => currentSelectedTags.has(t));

        card.style.display = matches ? "" : "none";
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

        window.history.replaceState(
          null,
          "",
          queryParams ? `/posts?${queryParams}` : "/posts"
        );
      }
    }

    // Event wiring
    allBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      currentSelectedTags.clear();
      updateButtonStates();
      renderPosts(true);
    });

    tagButtons.forEach((btn) => {
      const tag = btn.getAttribute("data-tag");
      if (!tag) return;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        currentSelectedTags.has(tag)
          ? currentSelectedTags.delete(tag)
          : currentSelectedTags.add(tag);

        updateButtonStates();
        renderPosts(true);
      });
    });

    updateButtonStates();
    renderPosts(false);

    return true;
  };

  // Try immediately
  if (tryInit()) return;

  // Otherwise, wait exactly once for DOM readiness
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        tryInit();
      },
      { once: true }
    );
  }
}
