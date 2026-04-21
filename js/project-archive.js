document.querySelectorAll("[data-project-archive]").forEach((container) => {
  const project = container.dataset.projectArchive;
  const releases = window.CorrosionReleases?.[project] || [];

  releases.forEach((release) => {
    const article = document.createElement("article");
    article.className = "retention-block";

    const media = document.createElement("div");
    media.className = "retention-media";

    const image = document.createElement("img");
    image.src = release.cover;
    image.alt = release.coverAlt || release.title;
    image.loading = "lazy";
    image.decoding = "async";
    media.append(image);

    const content = document.createElement("div");
    content.className = "retention-content";

    const header = document.createElement("header");

    const title = document.createElement("h2");
    title.className = "retention-title";
    title.textContent = `${release.title} [${release.label}]`;

    const subtitle = document.createElement("p");
    subtitle.className = "retention-subtitle";
    subtitle.textContent = `${release.year} - ${release.status}`;

    header.append(title, subtitle);
    content.append(header);

    release.descriptions.forEach((description) => {
      const paragraph = document.createElement("p");
      paragraph.className = "retention-description";
      paragraph.textContent = description;
      content.append(paragraph);
    });

    const nav = document.createElement("nav");
    nav.className = "retention-links";

    const listen = document.createElement("a");
    listen.href = release.listenUrl;
    listen.target = "_blank";
    listen.rel = "noopener";
    listen.textContent = "Escuchar";

    const download = document.createElement("a");
    download.href = release.downloadUrl;
    download.target = "_blank";
    download.rel = "noopener";
    download.textContent = "Descargar";

    nav.append(listen, download);
    content.append(nav);
    article.append(media, content);
    container.append(article);
  });
});
