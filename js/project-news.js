document.querySelectorAll("[data-project-news]").forEach((container) => {
  const project = container.dataset.projectNews;
  const releases = window.CorrosionReleases?.[project] || [];
  const release = releases.find((item) => item.featured) || releases[0];

  if (!release) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "novedad";

  const image = document.createElement("img");
  image.src = release.cover;
  image.alt = release.coverAlt || release.title;
  image.loading = "lazy";
  image.decoding = "async";

  const title = document.createElement("h3");
  title.textContent = release.featuredTitle || release.title;

  const text = document.createElement("p");
  text.textContent = release.featuredText || "";

  const nav = document.createElement("nav");
  nav.className = "status-actions";

  const action = document.createElement("div");
  action.className = "status-action";

  const link = document.createElement("a");
  link.href = release.listenUrl;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "OBTENER";

  action.append(link);
  nav.append(action);
  wrapper.append(image, title, text, nav);
  container.append(wrapper);
});
