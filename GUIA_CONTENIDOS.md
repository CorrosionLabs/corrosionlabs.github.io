# Guía rápida para modificar contenidos

Esta guía explica cómo actualizar contenidos de las páginas `collections.html`, `hub.html` y las herramientas internas de `tools/` sin romper la estructura del sitio.

## Estructura de imágenes

La carpeta `img/` está organizada así:

- `img/site/backgrounds/`: fondos generales del sitio
- `img/site/branding/`: iconos y marcas comunes
- `img/site/legacy/`: archivos antiguos no usados en la web actual
- `img/projects/sacro/`: imágenes del proyecto Sacro Servo
- `img/projects/zero/`: imágenes del proyecto Zero Sala
- `img/projects/corpus/`: imágenes del proyecto Corpus Submissum
- `img/projects/collections/`: imágenes de productos y colecciones visuales

## Vista general

- `collections.html` es el índice público de colecciones
- `products/` contiene una página HTML por producto
- `data/collections.json` es la fuente principal de datos de colecciones
- `tools/collections-builder.html` es la herramienta interna para crear o editar productos
- `tools/collections_builder.py` regenera el índice, las fichas y el sitemap
- `hub.html` contiene enlaces internos y externos editados directamente en HTML
- `tools/release-builder.html` es una herramienta auxiliar para generar bloques de releases
- `css/style.css` es el CSS compartido de la web pública

## 1. Página `Collections`

### Archivos que intervienen

- `collections.html`
- `products/`
- `data/collections.json`
- `tools/collections-builder.html`
- `tools/collections_builder.py`
- `sitemap.xml`

### Cómo funciona ahora

La sección de colecciones ya no depende de `js/collections-data.js` ni de `js/collections-page.js`.

Ahora el flujo es este:

1. Se guardan los datos en `data/collections.json`
2. El generador crea `collections.html`
3. El generador crea una ficha individual en `products/<slug>.html`
4. El generador actualiza `sitemap.xml`

### Qué tocar normalmente

Para añadir o editar un producto, lo normal es usar la herramienta:

- `tools/collections-builder.html`

Y ejecutar el servidor local:

- `python tools/collections_builder.py`

No hace falta editar a mano `collections.html` ni las páginas dentro de `products/` para cambios normales de contenido.

### Flujo recomendado de uso

1. Ejecuta:

```bash
python tools/collections_builder.py
```

2. Abre en el navegador:

```text
http://127.0.0.1:8765
```

3. Rellena el formulario del producto
4. Pulsa `Guardar producto`
5. La herramienta actualiza:
   - `data/collections.json`
   - `collections.html`
   - `products/<slug>.html`
   - `sitemap.xml`

### Campos del formulario

La herramienta de colecciones trabaja con estos campos:

- `slug`: identificador único usado en la URL
- `title`: nombre visible del producto
- `cover`: imagen principal
- `coverAlt`: texto alternativo de la portada
- `description`: uno o varios párrafos
- `gallery`: una línea por imagen con formato `ruta | alt`
- `buyUrl`: enlace principal de compra
- `extraText`: texto breve del bloque extra
- `extraUrl`: URL del bloque extra

### Estructura del JSON

Cada producto dentro de `data/collections.json` sigue esta forma:

```json
{
  "slug": "the-soft-servo-ost",
  "title": "The soft servo OST",
  "cover": "img/projects/collections/cober_soft_servo.jpg",
  "coverAlt": "The soft servo OST",
  "description": [
    "Música concebida para acompañar la lectura de El servo suave.",
    "Doce piezas para permanecer en la habitación mientras continúa la conversación."
  ],
  "gallery": [
    {
      "src": "img/projects/collections/cober_soft_servo.jpg",
      "alt": "The soft servo OST"
    }
  ],
  "buyUrl": "https://...",
  "extraText": "Canal de YouTube de Corrosion Labs",
  "extraUrl": "https://..."
}
```

### Qué se muestra en cada sitio

En `collections.html` se muestra:

- portada
- título
- primer párrafo de la descripción
- botón `Ver más`

En `products/<slug>.html` se muestra:

- portada
- descripción completa
- galería variable
- botón `Compra`
- bloque `Extra`

### Reglas importantes en `collections`

- cada `slug` debe ser único
- las rutas de imágenes deben apuntar a archivos reales
- el primer párrafo de `description` se usa como resumen del índice
- `gallery` puede tener una o varias imágenes
- si dejas vacío `buyUrl`, no aparecerá el botón de compra
- si dejas vacíos `extraText` o `extraUrl`, no aparecerá el bloque extra
- el CSS público siempre sale de `css/style.css`

### Cuándo tocar `collections.html`

Edita `collections.html` solo si quieres cambiar:

- el título de la página
- el texto introductorio
- el menú de navegación
- el pie de página

Ten en cuenta que `collections.html` es un archivo generado.
Si lo cambias a mano, el generador puede sobrescribirlo al regenerar.

### Cuándo tocar `products/<slug>.html`

Las fichas de producto también son generadas.
Si necesitas añadir contenido manual especial en una ficha concreta, usa el bloque marcado dentro del archivo:

- `<!-- PRODUCT_MANUAL_START -->`
- `<!-- PRODUCT_MANUAL_END -->`

Todo lo que pongas entre esas dos marcas se conserva al regenerar.

### Cuándo tocar `tools/collections_builder.py`

Edita `tools/collections_builder.py` solo si quieres cambiar:

- la estructura HTML generada
- la lógica del formulario o la API local
- la forma del JSON
- la actualización automática del sitemap

### Cuándo tocar `tools/collections-builder.html`

Edita `tools/collections-builder.html` solo si quieres cambiar:

- los textos de ayuda
- la disposición del formulario
- la vista previa
- los botones de la herramienta

Esta herramienta es interna y no forma parte de la web pública.

## 2. Página `Hub`

### Archivo que interviene

- `hub.html`

### Cómo está organizada

La página `hub.html` se edita directamente en HTML. Tiene estas zonas principales:

- navegación superior
- texto de introducción
- bloque `DENTRO DE LA WEB`
- bloque `FUERA DE LA WEB`
- pie de página

### Qué puedes cambiar fácilmente

En `hub.html` puedes editar:

- nombres de enlaces
- descripciones cortas
- URLs internas
- URLs externas
- títulos de bloques
- texto del footer

### Enlaces internos

Los enlaces internos están en el bloque:

- `Páginas principales`
- `Archivos internos`

Ejemplo:

```html
<a href="collections.html">
  <span>Collections</span>
  <span class="hub-link-note">Indice público de colecciones</span>
</a>
```

Qué significa cada parte:

- `href="collections.html"`: a qué página apunta
- primer `<span>`: nombre visible del enlace
- segundo `<span>`: descripción corta

### Enlaces externos

Los enlaces externos están agrupados por proyecto. Ejemplo:

```html
<a href="https://youtube.com/@corrosionlabs?si=sctskkTcgdJed9Yc" target="_blank" rel="noopener noreferrer">
  <span class="platform-mark">YT</span>
  <span>YouTube</span>
  <span class="external-mark" aria-hidden="true">↗</span>
</a>
```

Puedes cambiar:

- la URL
- las siglas (`YT`, `SC`, `AR`)
- el nombre visible (`YouTube`, `SoundCloud`, `Archive.org`)

### Cómo añadir un nuevo enlace interno

Duplica uno de los bloques `<a href="...">...</a>` dentro del grupo que corresponda.

### Cómo añadir una nueva plataforma externa

Duplica un `<li>` dentro de la lista del proyecto correspondiente.

### Cuándo tocar `css/style.css`

Solo hace falta si quieres cambiar:

- colores
- tamaños
- espaciados
- columnas
- comportamiento responsive

Para cambiar textos o enlaces no hace falta tocar CSS.

## 3. Imágenes y rutas

### Dónde colocar imágenes

Guarda las imágenes del sitio dentro de la carpeta que corresponda:

- `img/site/backgrounds/` para fondos generales
- `img/site/branding/` para logos e iconos comunes
- `img/projects/sacro/releases/` para releases de Sacro Servo
- `img/projects/zero/releases/` para releases de Zero Sala
- `img/projects/corpus/releases/` para releases de Corpus Submissum
- `img/projects/collections/` para productos de colecciones

Luego referencia los archivos así:

- `img/site/backgrounds/mi-imagen.jpg`
- `img/projects/collections/mi-producto/mi-portada.png`

### Recomendaciones

- usa nombres simples, sin espacios si es posible
- mantén una proporción consistente para portadas
- revisa que la ruta escrita coincida exactamente con el nombre del archivo

## 4. Herramienta `Release Builder`

### Archivos que intervienen

- `tools/release-builder.html`
- `tools/release_builder.py`

### Para qué sirve

Esta herramienta no publica nada por sí sola.
Su función es ayudarte a construir un bloque listo para pegar o guardar para los releases del sitio.

En otras palabras:

- aquí rellenas campos
- la herramienta genera un bloque de texto
- o copia imágenes a su carpeta
- luego ese bloque se pega en el archivo real de releases del sitio

### Qué puedes cambiar en `tools/release-builder.html`

Normalmente solo hace falta tocar este archivo si quieres cambiar:

- los textos de ayuda del formulario
- los valores por defecto
- las opciones del selector de proyecto
- la estructura del bloque generado
- el aspecto visual de la herramienta

### Qué puedes cambiar en `tools/release_builder.py`

Edita este archivo solo si quieres cambiar:

- el comportamiento de la app de escritorio
- la lógica de copiado de imágenes
- la generación del bloque de salida
- las rutas por defecto

### Qué no hace esta herramienta

Modificar `tools/release-builder.html` o `tools/release_builder.py` no cambia por sí solo los releases publicados en la web.

Lo que cambia los releases reales es el archivo de datos donde luego pegas el bloque generado.

### Flujo recomendado de uso

1. Abrir la herramienta de releases
2. Rellenar los campos del release
3. Copiar el bloque generado o guardar con imágenes
4. Pegar ese bloque en el archivo de releases correspondiente del proyecto
5. Guardar y revisar en la página final

### Campos habituales del formulario

La herramienta incluye campos como:

- proyecto
- etiqueta
- título
- año
- estado
- portada
- miniatura
- alt de portada
- título de novedad
- texto corto de novedad
- descripción larga
- URL para escuchar
- URL para descargar

## 5. Checklist antes de dar por bueno un cambio

Si has trabajado con colecciones:

- comprobar que `data/collections.json` siga teniendo JSON válido
- comprobar que las rutas de imágenes existan
- comprobar que `collections.html` muestre el producto nuevo o editado
- comprobar que exista `products/<slug>.html`
- comprobar que los enlaces abran donde corresponde
- comprobar que los textos nuevos no rompan el diseño
- comprobar que `sitemap.xml` incluya la ficha nueva si procede

Si has trabajado con releases:

- comprobar que el bloque generado esté completo
- comprobar que las URLs finales sean correctas
- comprobar que portada y miniatura existan
- comprobar que el release aparezca en la página del proyecto correcta

## 6. Resumen rápido

### Si quieres cambiar colecciones

- usa `python tools/collections_builder.py`
- abre `http://127.0.0.1:8765`
- guarda el producto desde `tools/collections-builder.html`

### Si quieres revisar o corregir los datos base de colecciones

- edita `data/collections.json`

### Si quieres cambiar textos fijos de la página de colecciones

- edita el generador `tools/collections_builder.py`

### Si quieres cambiar una ficha concreta con contenido especial

- edita solo el bloque entre `PRODUCT_MANUAL_START` y `PRODUCT_MANUAL_END`

### Si quieres cambiar accesos y enlaces del hub

- edita `hub.html`

### Si quieres cambiar la herramienta que genera colecciones

- edita `tools/collections-builder.html`
- o `tools/collections_builder.py`

### Si quieres cambiar la herramienta que genera releases

- edita `tools/release-builder.html`
- o `tools/release_builder.py`

## 7. Siguiente mejora recomendada

Si más adelante quieres escalar el sitio sin complicarlo, la siguiente evolución lógica sería:

- mover también el contenido del `hub` a un archivo de datos
- separar los releases en datos claros por proyecto
- dar a las herramientas internas un estilo todavía más unificado con el sitio

Así tendrías más partes del sitio gestionables desde contenido estructurado y menos texto duro dentro del HTML.
