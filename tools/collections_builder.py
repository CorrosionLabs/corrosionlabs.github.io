from __future__ import annotations

import json
import re
import unicodedata
from datetime import date
from html import escape
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "collections.json"
TOOLS_PAGE = ROOT / "tools" / "collections-builder.html"
COLLECTIONS_PAGE = ROOT / "collections.html"
PRODUCTS_DIR = ROOT / "products"
SITEMAP_FILE = ROOT / "sitemap.xml"
SITE_URL = "https://corrosionlabs.github.io"
MANUAL_START = "<!-- PRODUCT_MANUAL_START -->"
MANUAL_END = "<!-- PRODUCT_MANUAL_END -->"

XML_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
ET.register_namespace("", XML_NS["sm"])


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower().strip())
    value = "".join(character for character in value if not unicodedata.combining(character))
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-") or "producto"


def load_collections() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    items = [normalize_entry(item) for item in raw]
    return sorted(items, key=sort_key)


def save_collections(items: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    ordered = sorted((normalize_entry(item) for item in items), key=sort_key)
    DATA_FILE.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_text_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def normalize_gallery(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    gallery = []
    for item in value:
        if not isinstance(item, dict):
            continue
        src = str(item.get("src", "")).strip()
        alt = str(item.get("alt", "")).strip()
        if src:
            gallery.append({"src": src, "alt": alt})
    return gallery


def normalize_label(value: object, fallback: str) -> str:
    text = str(value or "").strip()
    return text or fallback


def normalize_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "si", "sí", "on"}
    return False


def normalize_year(value: object) -> str:
    text = str(value or "").strip()
    match = re.search(r"\d{4}", text)
    return match.group(0) if match else ""


def normalize_status_slug(value: object) -> str:
    text = slugify(str(value or "").strip())
    return text or "available"


def normalize_entry(item: dict) -> dict:
    title = str(item.get("title", "")).strip() or "Producto sin título"
    slug = slugify(str(item.get("slug", "")).strip() or title)
    cover = str(item.get("cover", "")).strip()
    description = normalize_text_list(item.get("description"))
    gallery = normalize_gallery(item.get("gallery"))
    status = normalize_status_slug(item.get("status"))
    status_label = normalize_label(item.get("statusLabel"), "Disponible" if status == "available" else status.replace("-", " ").title())
    return {
        "slug": slug,
        "title": title,
        "cover": cover,
        "coverAlt": str(item.get("coverAlt", "")).strip() or title,
        "description": description,
        "gallery": gallery,
        "category": normalize_label(item.get("category"), "General"),
        "language": normalize_label(item.get("language"), "Sin idioma"),
        "status": status,
        "statusLabel": status_label,
        "year": normalize_year(item.get("year")),
        "featured": normalize_bool(item.get("featured")),
        "buyUrl": str(item.get("buyUrl", "")).strip(),
        "extraText": str(item.get("extraText", "")).strip(),
        "extraUrl": str(item.get("extraUrl", "")).strip(),
    }


def sort_key(item: dict) -> tuple[int, int, str]:
    year = int(item["year"]) if item["year"].isdigit() else 0
    return (0 if item["featured"] else 1, -year, item["title"].lower())


def prefixed_asset(path: str, *, path_prefix: str) -> str:
    if not path or path.startswith(("http://", "https://", "/", "../")):
        return path
    return f"{path_prefix}{path}"


def extract_manual_block(path: Path) -> str:
    if not path.exists():
        return ""
    raw = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"{re.escape(MANUAL_START)}(.*?){re.escape(MANUAL_END)}", re.DOTALL)
    match = pattern.search(raw)
    return match.group(1).strip("\n") if match else ""


def html_page(
    title: str,
    description: str,
    canonical_path: str,
    body_class: str,
    content: str,
    og_image: str,
    *,
    path_prefix: str,
) -> str:
    canonical_url = f"{SITE_URL}/{canonical_path}".replace("//", "/").replace("https:/", "https://")
    og_image_url = og_image if og_image.startswith("http") else f"{SITE_URL}/{og_image}".replace("//", "/").replace("https:/", "https://")
    return f"""<!DOCTYPE html>
<html lang="es" translate="yes">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description)}">
  <meta name="theme-color" content="#0b0b0b">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="{escape(canonical_url)}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="{escape(canonical_url)}">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(description)}">
  <meta property="og:image" content="{escape(og_image_url)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(title)}">
  <meta name="twitter:description" content="{escape(description)}">
  <meta name="twitter:image" content="{escape(og_image_url)}">

  <link rel="stylesheet" href="{path_prefix}css/style.css?v=4">
</head>

<body class="{escape(body_class)}" translate="yes">
  <div class="container">
    <nav class="site-nav" aria-label="Indice principal">
      <a href="{path_prefix}index.html">Inicio</a>
      <a href="{path_prefix}sacro_servo.html">Sacro Servo</a>
      <a href="{path_prefix}zero_sala.html">Zero Sala</a>
      <a href="{path_prefix}corpus_submissum.html">Corpus Submissum</a>
      <a href="{path_prefix}condiciones.html">Condiciones</a>
      <a href="{path_prefix}contacto.html">Contacto</a>
      <a href="{path_prefix}collections.html">Colecciones</a>
      <a href="{path_prefix}hub.html">Hub</a>
    </nav>

{content}
  </div>
</body>
</html>
"""


def render_intro_header(title: str, subtitle: str) -> str:
    return f"""    <header class="identity-minimal">
      <h1 class="legal-title">{escape(title)}</h1>
      <p class="tagline">{escape(subtitle)}</p>
    </header>
"""


def render_collections_index(items: list[dict]) -> str:
    featured_items = [item for item in items if item["featured"]]

    if items:
        featured_html = ""
        if featured_items:
            featured_cards = "\n".join(render_featured_card(item) for item in featured_items[:6])
            featured_html = f"""      <section class="collections-featured-shell" aria-labelledby="collections-featured-title">
        <div class="collections-section-heading">
          <p class="collection-kicker">Selección</p>
          <h2 id="collections-featured-title" class="collections-section-title">Destacados</h2>
        </div>
        <div class="collections-featured-grid">
{featured_cards}
        </div>
      </section>

"""
        catalog_cards = "\n".join(render_index_card(item) for item in items)
        cards = f"""      <section class="collections-catalog-shell" aria-labelledby="collections-catalog-title">
        <div class="collections-section-heading">
          <p class="collection-kicker">Catálogo</p>
          <h2 id="collections-catalog-title" class="collections-section-title">Explorar colecciones</h2>
        </div>

        <div class="collections-toolbar" aria-label="Herramientas del catálogo">
          <label class="collections-search">
            <span>Buscar</span>
            <input type="search" id="collections-search" placeholder="Título, descripción o año">
          </label>
          <div id="collections-filters" class="collections-filters"></div>
        </div>

        <p id="collections-results" class="collections-results" aria-live="polite"></p>

        <section class="collections-list" id="collections-catalog">
{catalog_cards}
        </section>

        <div class="collections-actions">
          <button type="button" id="collections-load-more" class="collections-load-more">Cargar más</button>
        </div>
      </section>
"""
    else:
        featured_html = ""
        cards = '      <p class="collections-empty">No hay colecciones disponibles todavía.</p>'

    content = (
        render_intro_header("COLECCIONES", "Cartografía visual")
        + """    <main>
"""
        + featured_html
        + cards
        + render_collections_script(items)
        + """
    </main>

    <footer class="footer">
      <p class="footer-actions">
        <a href="hub.html">Volver al Hub</a>
        <a href="index.html">Inicio</a>
      </p>
    </footer>
"""
    )
    description = "Colecciones publicadas bajo Corrosion Labs con catálogo filtrable y fichas individuales para cada producto."
    return html_page(
        "Corrosion Labs Collections",
        description,
        "collections.html",
        "collections",
        content,
        "img/site/backgrounds/005.jpg",
        path_prefix="",
    )


def render_featured_card(item: dict) -> str:
    product_href = f"products/{item['slug']}.html"
    description = escape(item["description"][0]) if item["description"] else "Más información en la ficha del producto."
    return f"""          <article class="collection-featured-card">
            <a class="collection-featured-link" href="{escape(product_href)}">
              <div class="collection-cover collection-featured-cover">
                <img src="{escape(item['cover'])}" alt="{escape(item['coverAlt'])}" loading="lazy" decoding="async">
              </div>
              <div class="collection-featured-copy">
                <p class="collection-meta">{escape(item['category'])} / {escape(item['language'])}</p>
                <h3 class="collection-featured-title">{escape(item['title'])}</h3>
                <p class="collection-description">{description}</p>
              </div>
            </a>
          </article>"""


def render_index_card(item: dict) -> str:
    description = escape(item["description"][0]) if item["description"] else "Más información en la ficha del producto."
    product_href = f"products/{item['slug']}.html"
    searchable_text = " ".join(
        [item["title"], item["category"], item["language"], item["statusLabel"], item["year"], *item["description"]]
    ).lower()
    meta_parts = [item["category"], item["language"]]
    if item["year"]:
        meta_parts.append(item["year"])
    return f"""          <article class="collection-card"
            data-category="{escape(slugify(item['category']))}"
            data-language="{escape(slugify(item['language']))}"
            data-status="{escape(item['status'])}"
            data-search="{escape(searchable_text)}">
            <div class="collection-media">
              <div class="collection-cover">
                <img src="{escape(item['cover'])}" alt="{escape(item['coverAlt'])}" loading="lazy" decoding="async">
              </div>
            </div>
            <div class="collection-content">
              <h2 class="collection-title">{escape(item['title'])}</h2>
              <div class="collection-body">
                <p class="collection-meta">{escape(" / ".join(meta_parts))}</p>
                <p class="collection-description">{description}</p>
                <nav class="retention-links" aria-label="Enlaces para {escape(item['title'])}">
                  <a href="{escape(product_href)}">[VER MAS]</a>
                </nav>
              </div>
            </div>
          </article>"""


def render_collections_script(items: list[dict]) -> str:
    if not items:
        return ""

    categories = sorted({item["category"] for item in items if item["category"]}, key=str.lower)
    languages = sorted({item["language"] for item in items if item["language"]}, key=str.lower)
    statuses: dict[str, str] = {}
    for item in items:
        statuses.setdefault(item["status"], item["statusLabel"])

    config = {
        "initialVisible": 6,
        "filterGroups": [
            {
                "label": "Formato",
                "key": "category",
                "options": [{"value": slugify(value), "label": value} for value in categories],
            },
            {
                "label": "Idioma",
                "key": "language",
                "options": [{"value": slugify(value), "label": value} for value in languages],
            },
            {
                "label": "Estado",
                "key": "status",
                "options": [{"value": value, "label": label} for value, label in statuses.items()],
            },
        ],
    }

    return f"""
    <script>
      (() => {{
        const config = {json.dumps(config, ensure_ascii=False)};
        const searchInput = document.querySelector("#collections-search");
        const filtersRoot = document.querySelector("#collections-filters");
        const results = document.querySelector("#collections-results");
        const loadMoreButton = document.querySelector("#collections-load-more");
        const cards = Array.from(document.querySelectorAll("#collections-catalog .collection-card"));
        const state = {{
          search: "",
          category: "",
          language: "",
          status: "",
          visible: config.initialVisible
        }};

        if (!searchInput || !filtersRoot || !results || !loadMoreButton || !cards.length) {{
          return;
        }}

        const createFilterGroup = (group) => {{
          const wrapper = document.createElement("fieldset");
          wrapper.className = "collections-filter-group";

          const legend = document.createElement("legend");
          legend.textContent = group.label;
          wrapper.append(legend);

          const allButton = document.createElement("button");
          allButton.type = "button";
          allButton.className = "collections-filter-chip is-active";
          allButton.dataset.key = group.key;
          allButton.dataset.value = "";
          allButton.textContent = "Todos";
          wrapper.append(allButton);

          group.options.forEach((option) => {{
            const button = document.createElement("button");
            button.type = "button";
            button.className = "collections-filter-chip";
            button.dataset.key = group.key;
            button.dataset.value = option.value;
            button.textContent = option.label;
            wrapper.append(button);
          }});

          return wrapper;
        }};

        const syncFilterButtons = () => {{
          const buttons = filtersRoot.querySelectorAll(".collections-filter-chip");
          buttons.forEach((button) => {{
            const key = button.dataset.key;
            const value = button.dataset.value || "";
            button.classList.toggle("is-active", state[key] === value);
          }});
        }};

        const getMatches = () => cards.filter((card) => {{
          const matchesSearch = !state.search || (card.dataset.search || "").includes(state.search);
          const matchesCategory = !state.category || card.dataset.category === state.category;
          const matchesLanguage = !state.language || card.dataset.language === state.language;
          const matchesStatus = !state.status || card.dataset.status === state.status;
          return matchesSearch && matchesCategory && matchesLanguage && matchesStatus;
        }});

        const applyFilters = () => {{
          const filtered = getMatches();

          cards.forEach((card) => {{
            card.hidden = true;
          }});

          filtered.slice(0, state.visible).forEach((card) => {{
            card.hidden = false;
          }});

          const total = filtered.length;
          const visibleNow = Math.min(total, state.visible);
          results.textContent = total
            ? `Mostrando ${{visibleNow}} de ${{total}} producto(s).`
            : "No hay resultados con los filtros actuales.";
          loadMoreButton.hidden = total <= state.visible;
        }};

        config.filterGroups.forEach((group) => {{
          filtersRoot.append(createFilterGroup(group));
        }});

        filtersRoot.addEventListener("click", (event) => {{
          const button = event.target.closest(".collections-filter-chip");
          if (!button) {{
            return;
          }}
          state[button.dataset.key] = button.dataset.value || "";
          state.visible = config.initialVisible;
          syncFilterButtons();
          applyFilters();
        }});

        searchInput.addEventListener("input", () => {{
          state.search = searchInput.value.trim().toLowerCase();
          state.visible = config.initialVisible;
          applyFilters();
        }});

        loadMoreButton.addEventListener("click", () => {{
          state.visible += config.initialVisible;
          applyFilters();
        }});

        syncFilterButtons();
        applyFilters();
      }})();
    </script>
"""


def render_product_page(item: dict, manual_block: str = "") -> str:
    description_text = item["description"][0] if item["description"] else f"Ficha individual de {item['title']}."
    cover_src = prefixed_asset(item["cover"], path_prefix="../")
    gallery_html = ""
    if item["gallery"]:
        images = "\n".join(
            f'          <img src="{escape(prefixed_asset(entry["src"], path_prefix="../"))}" alt="{escape(entry["alt"] or item["title"])}" loading="lazy" decoding="async">'
            for entry in item["gallery"]
        )
        gallery_html = f"""        <div class="collection-product-section">
          <p class="collection-label">Galería</p>
          <div class="collection-gallery collection-gallery-product">
{images}
          </div>
        </div>
"""

    extra_html = ""
    if item["extraText"] and item["extraUrl"]:
        extra_html = f"""        <div class="collection-product-section">
          <p class="collection-label">Extra</p>
          <p class="collection-description collection-extra-text">{escape(item["extraText"])}</p>
          <p class="collection-extra-link"><a href="{escape(item["extraUrl"])}" target="_blank" rel="noopener noreferrer">{escape(item["extraUrl"])}</a></p>
        </div>
"""

    if manual_block.strip():
        manual_html = f"""        <div class="collection-product-section collection-manual-section">
          <p class="collection-label">Contenido adicional</p>
          {MANUAL_START}
{manual_block}
          {MANUAL_END}
        </div>
"""
    else:
        manual_html = f"""        <div class="collection-manual-slot" hidden>
          {MANUAL_START}
          {MANUAL_END}
        </div>
"""

    paragraphs = "\n".join(
        f'          <p class="collection-description">{escape(paragraph)}</p>' for paragraph in item["description"]
    )

    buy_link = ""
    if item["buyUrl"]:
        buy_link = f'          <a href="{escape(item["buyUrl"])}" target="_blank" rel="noopener noreferrer">[COMPRA]</a>\n'

    content = (
        render_intro_header(item["title"].upper(), "Ficha de producto")
        + f"""    <main class="collection-product-page">
      <p class="collections-intro">
        Información completa, galería y acceso directo para {escape(item["title"])}.
      </p>

      <article class="collection-product-card">
        <div class="collection-product-layout">
          <div class="collection-product-media">
            <p class="collection-label">Portada</p>
            <div class="collection-cover">
              <img src="{escape(cover_src)}" alt="{escape(item["coverAlt"])}" loading="eager" decoding="async">
            </div>
          </div>

          <div class="collection-product-content">
            <h2 class="collection-title">{escape(item["title"])}</h2>
            <div class="collection-product-section">
              <p class="collection-label">Descripción</p>
{paragraphs}
            </div>
{gallery_html}{extra_html}{manual_html}
            <nav class="retention-links" aria-label="Acciones para {escape(item["title"])}">
{buy_link}          <a href="../collections.html">[VOLVER]</a>
            </nav>
          </div>
        </div>
      </article>
    </main>

    <footer class="footer">
      <p class="footer-actions">
        <a href="../collections.html">Indice de colecciones</a>
        <a href="../index.html">Inicio</a>
      </p>
    </footer>
"""
    )
    return html_page(
        f"{item['title']} | Corrosion Labs",
        description_text,
        f"products/{item['slug']}.html",
        "collections collection-product",
        content,
        item["cover"] or "img/site/backgrounds/005.jpg",
        path_prefix="../",
    )


def update_sitemap(items: list[dict]) -> None:
    today = date.today().isoformat()
    if SITEMAP_FILE.exists():
        tree = ET.parse(SITEMAP_FILE)
        root = tree.getroot()
    else:
        root = ET.Element(f"{{{XML_NS['sm']}}}urlset")
        tree = ET.ElementTree(root)

    entries: dict[str, ET.Element] = {}
    for url in root.findall("sm:url", XML_NS):
        loc = url.find("sm:loc", XML_NS)
        if loc is not None and loc.text:
            entries[loc.text] = url

    base_entries = {
        f"{SITE_URL}/collections.html": "0.7",
    }
    product_entries = {
        f"{SITE_URL}/products/{item['slug']}.html": "0.6" for item in items
    }

    for loc, priority in {**base_entries, **product_entries}.items():
        url = entries.get(loc)
        if url is None:
            url = ET.SubElement(root, f"{{{XML_NS['sm']}}}url")
            ET.SubElement(url, f"{{{XML_NS['sm']}}}loc").text = loc
            ET.SubElement(url, f"{{{XML_NS['sm']}}}lastmod").text = today
            ET.SubElement(url, f"{{{XML_NS['sm']}}}priority").text = priority
            entries[loc] = url
        else:
            lastmod = url.find("sm:lastmod", XML_NS)
            priority_tag = url.find("sm:priority", XML_NS)
            if lastmod is None:
                lastmod = ET.SubElement(url, f"{{{XML_NS['sm']}}}lastmod")
            if priority_tag is None:
                priority_tag = ET.SubElement(url, f"{{{XML_NS['sm']}}}priority")
            lastmod.text = today
            priority_tag.text = priority

    dynamic_prefix = f"{SITE_URL}/products/"
    for loc, url in list(entries.items()):
        if loc.startswith(dynamic_prefix) and loc not in product_entries:
            root.remove(url)

    ET.indent(tree, space="  ")
    tree.write(SITEMAP_FILE, encoding="utf-8", xml_declaration=True)


def build_site() -> dict[str, int]:
    items = load_collections()
    COLLECTIONS_PAGE.write_text(render_collections_index(items), encoding="utf-8")

    PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
    manual_blocks = {html_file.stem: extract_manual_block(html_file) for html_file in PRODUCTS_DIR.glob("*.html")}
    for html_file in PRODUCTS_DIR.glob("*.html"):
        html_file.unlink()

    for item in items:
        target = PRODUCTS_DIR / f"{item['slug']}.html"
        target.write_text(render_product_page(item, manual_blocks.get(item["slug"], "")), encoding="utf-8")

    update_sitemap(items)
    return {"collections": len(items)}


def parse_payload(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length) if length else b"{}"
    return json.loads(raw.decode("utf-8"))


def save_product(payload: dict) -> dict:
    descriptions = [
        re.sub(r"\s+", " ", part).strip()
        for part in re.split(r"\n\s*\n", str(payload.get("description", "")).strip())
        if part.strip()
    ]
    gallery = []
    for line in str(payload.get("gallery", "")).splitlines():
        if not line.strip():
            continue
        src, _, alt = line.partition("|")
        src = src.strip()
        alt = alt.strip()
        if src:
            gallery.append({"src": src, "alt": alt})

    item = normalize_entry(
        {
            "slug": payload.get("slug", ""),
            "title": payload.get("title", ""),
            "cover": payload.get("cover", ""),
            "coverAlt": payload.get("coverAlt", ""),
            "description": descriptions,
            "gallery": gallery,
            "category": payload.get("category", ""),
            "language": payload.get("language", ""),
            "status": payload.get("status", ""),
            "statusLabel": payload.get("statusLabel", ""),
            "year": payload.get("year", ""),
            "featured": payload.get("featured", False),
            "buyUrl": payload.get("buyUrl", ""),
            "extraText": payload.get("extraText", ""),
            "extraUrl": payload.get("extraUrl", ""),
        }
    )

    if not item["title"] or not item["cover"] or not item["description"]:
        raise ValueError("Título, portada y descripción son obligatorios.")

    items = load_collections()
    updated = False
    for index, current in enumerate(items):
        if current["slug"] == item["slug"]:
            items[index] = item
            updated = True
            break
    if not updated:
        items.append(item)

    save_collections(items)
    build_site()
    return item


class BuilderHandler(BaseHTTPRequestHandler):
    def _send_json(self, payload: dict, status: int = HTTPStatus.OK) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _send_file(self, path: Path, content_type: str) -> None:
        raw = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in {"/", "/tools/collections-builder.html"}:
            self._send_file(TOOLS_PAGE, "text/html; charset=utf-8")
            return
        if path == "/api/collections":
            self._send_json({"items": load_collections()})
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            if path == "/api/save":
                item = save_product(parse_payload(self))
                self._send_json({"ok": True, "item": item})
                return
            if path == "/api/build":
                result = build_site()
                self._send_json({"ok": True, "result": result})
                return
            self.send_error(HTTPStatus.NOT_FOUND)
        except Exception as error:  # noqa: BLE001
            self._send_json({"ok": False, "error": str(error)}, status=HTTPStatus.BAD_REQUEST)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


def main() -> None:
    build_site()
    server = ThreadingHTTPServer(("127.0.0.1", 8765), BuilderHandler)
    print("Collections Builder activo en http://127.0.0.1:8765")
    print("Pulsa Ctrl+C para cerrar el servidor.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
