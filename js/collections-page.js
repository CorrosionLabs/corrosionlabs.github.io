function loadCollections() {
  const container = document.querySelector("[data-collections-root]");

  if (!container) {
    return;
  }

  const items = Array.isArray(window.CorrosionCollections)
    ? window.CorrosionCollections
    : [];

  if (!items.length) {
    container.innerHTML = '<p class="collections-empty">No hay colecciones disponibles todavia.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "collection-card";

    const mediaColumn = document.createElement("div");
    mediaColumn.className = "collection-media";

    const contentColumn = document.createElement("div");
    contentColumn.className = "collection-content";

    const title = document.createElement("h2");
    title.className = "collection-title";
    title.textContent = item.title || "Sin titulo";
    contentColumn.append(title);

    const coverLabel = document.createElement("p");
    coverLabel.className = "collection-label";
    coverLabel.textContent = "PORTADA";
    mediaColumn.append(coverLabel);

    const cover = document.createElement("div");
    cover.className = "collection-cover";

    const coverImage = document.createElement("img");
    coverImage.src = item.cover;
    coverImage.alt = item.coverAlt || item.title || "Portada";
    coverImage.loading = "lazy";
    coverImage.decoding = "async";
    cover.append(coverImage);
    mediaColumn.append(cover);

    const body = document.createElement("div");
    body.className = "collection-body";

    const descriptionLabel = document.createElement("p");
    descriptionLabel.className = "collection-label";
    descriptionLabel.textContent = "Descripción";
    body.append(descriptionLabel);

    const descriptions = Array.isArray(item.description)
      ? item.description
      : [item.description].filter(Boolean);

    descriptions.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.className = "collection-description";
      paragraph.textContent = text;
      body.append(paragraph);
    });

    const galleryLabel = document.createElement("p");
    galleryLabel.className = "collection-label";
    galleryLabel.textContent = "3 miniaturas interiores";
    body.append(galleryLabel);

    const gallery = document.createElement("div");
    gallery.className = "collection-gallery";

    const galleryItems = Array.isArray(item.gallery) ? item.gallery.slice(0, 3) : [];
    galleryItems.forEach((entry, index) => {
      const image = document.createElement("img");
      image.src = entry.src;
      image.alt = entry.alt || `${item.title || "Coleccion"} - imagen ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      gallery.append(image);
    });

    body.append(gallery);

    const links = document.createElement("nav");
    links.className = "retention-links";
    links.setAttribute("aria-label", `Enlaces para ${item.title || "esta coleccion"}`);

    if (item.buyUrl) {
      const buyLink = document.createElement("a");
      buyLink.href = item.buyUrl;
      buyLink.target = "_blank";
      buyLink.rel = "noopener noreferrer";
      buyLink.textContent = "[COMPRA]";
      links.append(buyLink);
    }

    if (item.extrasUrl) {
      const extrasLink = document.createElement("a");
      extrasLink.href = item.extrasUrl;
      extrasLink.target = "_blank";
      extrasLink.rel = "noopener noreferrer";
      extrasLink.textContent = "[EXTRAS]";
      links.append(extrasLink);
    }

    body.append(links);
    contentColumn.append(body);
    article.append(mediaColumn, contentColumn);
    fragment.append(article);
  });

  container.innerHTML = "";
  container.append(fragment);
}

loadCollections();
