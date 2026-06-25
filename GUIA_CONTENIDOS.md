# Guía rápida para modificar contenidos

Esta guía explica cómo actualizar contenidos de las páginas `collections.html`, `hub.html` y `tools/release-builder.html` sin romper la estructura del sitio.

## Estructura de imágenes

La carpeta `img/` está organizada así:

- `img/site/backgrounds/`: fondos generales del sitio
- `img/site/branding/`: iconos y marcas comunes
- `img/site/legacy/`: archivos antiguos no usados en la web actual
- `img/projects/sacro/`: imágenes del proyecto Sacro Servo
- `img/projects/zero/`: imágenes del proyecto Zero Sala
- `img/projects/corpus/`: imágenes del proyecto Corpus Submissum

## Vista general

- `collections.html` muestra una página de colecciones.
- `js/collections-data.js` guarda el contenido de esas colecciones.
- `js/collections-page.js` pinta automáticamente las tarjetas en pantalla.
- `hub.html` contiene enlaces internos y externos editados directamente en HTML.
- `tools/release-builder.html` es una herramienta auxiliar para generar bloques de releases.
- `css/style.css` solo hace falta tocarlo si quieres cambiar estilos o distribución visual.

## 1. Página `Collections`

### Archivos que intervienen

- `collections.html`
- `js/collections-data.js`
- `js/collections-page.js`

### Qué tocar normalmente

Para cambiar el contenido de la página, lo habitual es editar solo:

- `js/collections-data.js`

No hace falta tocar `collections.html` ni `js/collections-page.js` si solo vas a:

- cambiar títulos
- cambiar descripciones
- cambiar imágenes
- añadir o quitar colecciones
- actualizar enlaces

### Estructura de una colección

Cada colección dentro de `js/collections-data.js` sigue esta forma:

```js
{
  title: "Collection 01",
  cover: "img/projects/sacro/releases/ejecuta/img_01_300x300.jpg",
  coverAlt: "Portada de Collection 01",
  description: [
    "Texto 1",
    "Texto 2"
  ],
  gallery: [
    { src: "img/projects/sacro/releases/ejecuta/img_01_300x300.jpg", alt: "Vista 1" },
    { src: "img/projects/sacro/releases/ejecuta/img_02_300x300.jpg", alt: "Vista 2" },
    { src: "img/projects/zero/releases/ingravidad/coverZero_01.jpg", alt: "Vista 3" }
  ],
  buyUrl: "https://...",
  extrasUrl: "https://..."
}
```

### Cómo editar una colección existente

Abre `js/collections-data.js` y modifica los valores del bloque que ya existe:

- `title`: nombre visible de la colección
- `cover`: imagen principal
- `coverAlt`: texto alternativo de la portada
- `description`: uno o varios párrafos
- `gallery`: hasta 3 miniaturas interiores
- `buyUrl`: enlace principal de compra o acceso
- `extrasUrl`: enlace secundario de extras, vídeo o material adicional

### Cómo añadir una nueva colección

Dentro del array `window.CorrosionCollections = [ ... ]`, duplica una entrada completa y cambia sus datos.

Ejemplo:

```js
window.CorrosionCollections = [
  {
    title: "Collection 01",
    cover: "img/projects/sacro/releases/ejecuta/img_01_300x300.jpg",
    coverAlt: "Portada de Collection 01",
    description: [
      "Primera colección."
    ],
    gallery: [
      { src: "img/projects/sacro/releases/ejecuta/img_01_300x300.jpg", alt: "Vista 1" },
      { src: "img/projects/sacro/releases/ejecuta/img_02_300x300.jpg", alt: "Vista 2" },
      { src: "img/projects/zero/releases/ingravidad/coverZero_01.jpg", alt: "Vista 3" }
    ],
    buyUrl: "https://...",
    extrasUrl: "https://..."
  },
  {
    title: "Collection 02",
    cover: "img/projects/sacro/releases/collection-02/nueva_portada.jpg",
    coverAlt: "Portada de Collection 02",
    description: [
      "Texto principal de la segunda colección.",
      "Segundo párrafo opcional."
    ],
    gallery: [
      { src: "img/projects/sacro/releases/collection-02/nueva_01.jpg", alt: "Vista 1 de Collection 02" },
      { src: "img/projects/sacro/releases/collection-02/nueva_02.jpg", alt: "Vista 2 de Collection 02" },
      { src: "img/projects/sacro/releases/collection-02/nueva_03.jpg", alt: "Vista 3 de Collection 02" }
    ],
    buyUrl: "https://...",
    extrasUrl: "https://..."
  }
];
```

### Reglas importantes en `collections`

- Mantén las comas entre bloques.
- Usa rutas correctas para imágenes, por ejemplo `img/projects/sacro/releases/ejecuta/cover.jpg`.
- La galería está pensada para 3 imágenes; si pones más, el script solo muestra las tres primeras.
- Si dejas vacío `extrasUrl`, no aparecerá ese botón.
- Si dejas vacío `buyUrl`, no aparecerá ese botón.

### Cuándo tocar `collections.html`

Edita `collections.html` solo si quieres cambiar:

- el título de la página
- el texto introductorio
- el menú de navegación
- el pie de página

### Cuándo tocar `js/collections-page.js`

Edita `js/collections-page.js` solo si quieres cambiar la estructura visual generada:

- cambiar el orden portada / texto / galería
- renombrar etiquetas como `PORTADA` o `DescripciÃ³n`
- añadir nuevos campos visibles
- cambiar la lógica de botones o enlaces

Si solo vas a cambiar contenido, no hace falta tocar este archivo.

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
  <span class="hub-link-note">Pagina de colecciones cargada desde JSON</span>
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

Luego referencia los archivos así:

- `img/site/backgrounds/mi-imagen.jpg`
- `img/projects/sacro/releases/mi-release/mi-portada.png`

### Recomendaciones

- usa nombres simples, sin espacios si es posible
- mantén una proporción consistente para portadas
- revisa que la ruta escrita coincida exactamente con el nombre del archivo

## 4. Herramienta `Release Builder`

### Archivo que interviene

- `tools/release-builder.html`

### Para qué sirve

Esta página no es una sección pública de contenido como `collections` o `hub`.
Su función es ayudarte a construir un bloque listo para pegar en el archivo de datos de releases del sitio.

En otras palabras:

- aquí rellenas campos
- la herramienta genera un bloque de texto
- luego ese bloque se pega en el archivo real de releases

### Qué puedes cambiar en `tools/release-builder.html`

Normalmente solo hace falta tocar este archivo si quieres cambiar:

- los textos de ayuda del formulario
- los valores por defecto
- las opciones del selector de proyecto
- la estructura del bloque generado
- el aspecto visual de la herramienta

### Qué no hace esta herramienta

Modificar `tools/release-builder.html` no cambia por sí solo los releases publicados en la web.

Lo que cambia los releases reales es el archivo de datos donde luego pegas el bloque generado.

### Flujo recomendado de uso

1. Abrir `tools/release-builder.html`
2. Rellenar los campos del release
3. Copiar el bloque generado
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

### Cuándo tocar esta herramienta

Edita `tools/release-builder.html` solo si quieres mejorar la herramienta en sí.

Si solo quieres añadir o cambiar un lanzamiento, lo normal es:

- usar la herramienta para generar el bloque
- pegar el resultado en el archivo de releases

## 5. Checklist antes de dar por bueno un cambio

- comprobar que no falten comas en `js/collections-data.js`
- comprobar que las rutas de imágenes existan
- comprobar que los enlaces abran donde corresponde
- comprobar que la nueva colección aparezca en `collections.html`
- comprobar que los textos nuevos no rompan el diseño

Si has trabajado con releases:

- comprobar que el bloque generado esté completo
- comprobar que las URLs finales sean correctas
- comprobar que portada y miniatura existan
- comprobar que el release aparezca en la página del proyecto correcta

## 6. Resumen rápido

### Si quieres cambiar colecciones

- edita `js/collections-data.js`

### Si quieres cambiar textos fijos de la página de colecciones

- edita `collections.html`

### Si quieres cambiar cómo se dibujan las tarjetas

- edita `js/collections-page.js`

### Si quieres cambiar accesos y enlaces del hub

- edita `hub.html`

### Si quieres cambiar la herramienta que genera releases

- edita `tools/release-builder.html`

### Si quieres cambiar un release real publicado

- usa `tools/release-builder.html` para generar el bloque
- pega el resultado en el archivo de releases del proyecto

## 7. Siguiente mejora recomendada

Si más adelante quieres escalar el sitio sin complicarlo, la siguiente evolución lógica sería:

- mover también el contenido del `hub` a un archivo de datos
- separar los releases en datos claros por proyecto
- usar la misma lógica de carga que ya usa `collections`

Así tendrías dos páginas gestionables desde contenido estructurado y menos texto duro dentro del HTML.
