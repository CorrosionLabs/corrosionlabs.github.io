document.querySelectorAll("[data-project-platforms]").forEach((container) => {
  const project = container.dataset.projectPlatforms;
  const platforms = window.CorrosionProjects?.[project]?.platforms || [];

  if (platforms.length === 0) {
    return;
  }

  const list = document.createElement("ul");
  list.className = "platforms-list";

  platforms.forEach((platform) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const mark = document.createElement("span");
    const label = document.createElement("span");
    const external = document.createElement("span");

    link.href = platform.url;
    link.target = "_blank";
    link.rel = "noopener";

    mark.className = "platform-mark";
    mark.textContent = platform.mark;

    label.textContent = platform.label;

    external.className = "external-mark";
    external.setAttribute("aria-hidden", "true");
    external.textContent = "↗";

    link.append(mark, label, external);
    item.append(link);
    list.append(item);
  });

  container.append(list);
});
