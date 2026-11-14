(() => {
  const links = [
    ["Inicio", "corrosion-labs.html"],
    ["Sacro Servo", "pages/sacro_servo.html"],
    ["Zero Sala", "pages/zero_sala.html"],
    ["Corpus Submissum", "pages/corpus_submissum.html"],
    ["Condiciones", "pages/condiciones.html"],
    ["Contacto", "pages/contacto.html"],
    ["Colecciones", "pages/collections.html"],
    ["Corrosion Strategies", "strategies/"],
    ["Idea Collider", "idea-collider/"],
    ["TOOLS", "tools/"],
    ["Hub", "pages/hub.html"]
  ];

  const script = document.currentScript;
  const root = new URL("../", script.src);
  const currentPage = new URL(window.location.href);

  function appendLinks(container) {
    links.forEach(([name, destination]) => {
      const link = document.createElement("a");
      const url = new URL(destination, root);
      link.href = url.href;
      link.textContent = name;

      if (url.pathname === currentPage.pathname) {
        link.setAttribute("aria-current", "page");
      }

      container.appendChild(link);
    });
  }

  function buildNavigation(className, label) {
    const navigation = document.createElement("nav");
    navigation.className = className;
    navigation.setAttribute("aria-label", label);
    appendLinks(navigation);

    return navigation;
  }

  function buildSiteNavigation(panelId) {
    const navigation = document.createElement("nav");
    const toggle = document.createElement("button");
    const panel = document.createElement("div");

    navigation.className = "site-nav";
    navigation.setAttribute("aria-label", "Índice principal");

    toggle.className = "site-nav-toggle";
    toggle.type = "button";
    toggle.textContent = "☰";
    toggle.setAttribute("aria-label", "Abrir navegación");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", panelId);

    panel.className = "site-nav-panel";
    panel.id = panelId;
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    appendLinks(panel);

    navigation.append(toggle, panel);

    function setOpen(open) {
      navigation.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar navegación" : "Abrir navegación");
      panel.setAttribute("aria-hidden", String(!open));
      panel.toggleAttribute("inert", !open);
    }

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("click", (event) => {
      if (toggle.getAttribute("aria-expanded") === "true" && !navigation.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    return navigation;
  }

  document.querySelectorAll(".site-nav").forEach((navigation, index) => {
    navigation.replaceWith(buildSiteNavigation(`site-nav-panel-${index + 1}`));
  });

  document.querySelectorAll(".footer").forEach((footer) => {
    if (footer.querySelector(".footer-nav")) {
      return;
    }

    const navigation = buildNavigation("footer-nav", "Navegación inferior");
    const firstActions = footer.querySelector(".footer-actions");
    footer.insertBefore(navigation, firstActions || null);
  });
})();
