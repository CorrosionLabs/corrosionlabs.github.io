# corrosionlabs.github.io
CORROSION LABS explora la creacion visual mediante inteligencia artificial aplicada a imaginarios biomecanicos y posthumanos. Texturas organicas, cables vivos y estructuras hibridas forman un archivo visual de cuerpos en transicion.

## Estructura base
- `img/site/backgrounds/`: fondos generales del sitio
- `img/site/branding/`: marca global de Corrosion Labs
- `img/projects/<proyecto>/branding/`: identidad visual de cada proyecto
- `img/projects/<proyecto>/releases/`: portadas y miniaturas de releases
- `img/projects/collections/<slug>/`: portada y galeria de cada producto
- `data/collections.json`: fuente principal del catalogo de colecciones
- `tools/`: herramientas internas para regenerar colecciones y preparar releases

## Convenciones
- El branding global vive en `img/site/branding/`.
- El branding especifico de `Sacro Servo`, `Zero Sala` y `Corpus Submissum` vive dentro de su proyecto.
- Cada producto de `collections` tiene su propia carpeta con nombres previsibles como `cover.jpg` e `image-01.jpg`.
- Los favicons y `site.webmanifest` permanecen en la raiz porque son activos de aplicacion del sitio completo.
