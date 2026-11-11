(() => {
  const source = document.querySelector(".site-nav");
  const footer = document.querySelector(".footer");

  if (!source || !footer || footer.querySelector(".footer-nav")) {
    return;
  }

  const navigation = source.cloneNode(true);
  navigation.classList.remove("site-nav");
  navigation.classList.add("footer-nav");
  navigation.setAttribute("aria-label", "Navegación inferior");
  const firstActions = footer.querySelector(".footer-actions");
  footer.insertBefore(navigation, firstActions || null);
})();
