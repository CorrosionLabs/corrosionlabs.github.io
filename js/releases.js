window.resolveCorrosionAssetPath = function resolveCorrosionAssetPath(path) {
  if (!path || /^(?:[a-z]+:|\/|\.\/|\.\.\/)/i.test(path)) {
    return path;
  }

  const currentPath = window.location.pathname || "";

  if (currentPath.includes("/pages/internal/")) {
    return `../../${path}`;
  }

  if (currentPath.includes("/pages/") || currentPath.includes("/products/")) {
    return `../${path}`;
  }

  return path;
};

window.CorrosionReleases = {
  sacro: [
    {
      title: "Ejecuta",
      label: "Álbum 01",
      year: "2026",
      status: "Registro cerrado",
      cover: "img/projects/sacro/releases/ejecuta/img_01_300x300.jpg",
      thumbnail: "img/projects/sacro/releases/ejecuta/img_01_300x300.jpg",
      coverAlt: "Ejecuta - portada",
      featuredTitle: "Album Ejecuta",
      featuredText: "Primer artefacto publicado dentro del sistema operativo Sacro Servo.",
      descriptions: [
        "Primer trabajo de estudio que establece el núcleo conceptual y sonoro del proyecto: una fusión de dark industrial, pulsos mecánicos y estética cyberpunk en español.",
        "El disco explora la transición entre biología y sistema, placer y circuito, ciudad y error. Las canciones no narran historias convencionales; documentan procesos: intervención, conexión, sobrecarga y adaptación. La voz funciona como transmisión más que como confesión, y el ritmo avanza entre tensión contenida y estallidos eléctricos.",
        "En este debut, la máquina no aparece como amenaza, sino como interfaz. La ciudad es un organismo saturado de neón y datos. El dolor deja de ser castigo y se convierte en consecuencia del progreso.",
        "Un primer manifiesto sonoro: frío, físico y conceptual."
      ],
      listenUrl: "https://archive.org/details/sacro-servo-01.-ejecuta",
      downloadUrl: "https://archive.org/search?query=creator%3A%22Corrosion+Labs%22",
      featured: true
    }
  ],
  zero: [
    {
      title: "ingravidad",
      label: "Álbum 01",
      year: "2026",
      status: "Reverberación consecuente",
      cover: "img/projects/zero/releases/ingravidad/coverZero_01.jpg",
      thumbnail: "img/projects/zero/releases/ingravidad/coverZero_01.jpg",
      coverAlt: "ingravidad - portada",
      featuredTitle: "Album ingravedad",
      featuredText: "Los pasillos de hormigón no son un lugar, sino una condición. Figuras protegidas avanzan mientras algo empieza a fallar: la gravedad, el cuerpo, la percepción. No hay un punto exacto donde comienza la mutación.\n\nLa imagen no explica. Sugiere.\nEl sonido no acompaña. Permanece.",
      descriptions: [
        "Primer registro dentro de Zero Sala: una masa sonora sostenida donde el origen pierde relevancia y el sonido se convierte en presencia. No hay composición en el sentido tradicional, sino acumulación, permanencia y deriva.",
        "El material no evoluciona, se dilata. Las capas no se organizan en estructura, sino que se superponen hasta generar un estado continuo. No hay narración ni progresión: solo una ocupación progresiva del espacio.",
        "Las fuentes - máquinas, residuos sonoros, fragmentos deformados - dejan de ser identificables. El sonido no representa nada, no describe nada. Se limita a persistir.",
        "No es un álbum. Es un volumen en suspensión. Un estado acústico que permanece incluso cuando deja de escucharse."
      ],
      listenUrl: "https://archive.org/details/zero-sala.-ingravedad_202603",
      downloadUrl: "https://archive.org/search?query=creator%3A%22Corrosion+Labs%22",
      featured: true
    }
  ],
  corpus: [
    {
      title: "Respiración Forzada",
      label: "Álbum 01",
      year: "2026",
      status: "Registro activo",
      cover: "img/projects/corpus/releases/respiracion-forzada/corpus_respiracion_forzada_cover.jpg",
      thumbnail: "img/projects/corpus/releases/respiracion-forzada/corpus_respiracion_forzada_thumb.jpg",
      coverAlt: "Respiración Forzada - portada",
      featuredTitle: "Album Respiración Forzada",
      featuredText: "Corpus Submissum (de Sacro Servo) nace como una extensión interna de Sacro Servo: un subproyecto centrado en lo instrumental donde la voz se elimina como vehículo de significado, pero no como presencia.",
      descriptions: [
        "Aquí no hay letras, pero el cuerpo sigue inscrito en el sonido. Respiraciones convertidas en ruido, pulsos transformados en percusión, tensión muscular traducida a capas de distorsión. La ausencia de palabra no implica vacío, sino una forma más directa de intervención: sin filtro, sin relato, sin mediación.",
        "Corpus Submissum se construye desde la idea de sumisión física y sistémica. No como concepto abstracto, sino como experiencia repetitiva: presión constante, ciclos cerrados, estructuras que obligan al movimiento sin permitir salida. Los ritmos no invitan, imponen. Las texturas no decoran, envuelven. Cada elemento está diseñado para mantener al oyente dentro de un espacio contenido, donde el tiempo se dilata y la percepción se vuelve densa.",
        "La materia sonora es industrial y pesada: impactos metálicos, resonancias profundas, subgraves persistentes, capas de drones que evolucionan lentamente o permanecen estáticas como una maquinaria en funcionamiento continuo. No hay progresión clásica, sino acumulación. No hay clímax, sino desgaste.",
        "Cada pieza funciona como un entorno autónomo, casi arquitectónico. Un sistema cerrado donde el cuerpo —biológico o sintético— deja de ejercer control y pasa a adaptarse, a resistir o a integrarse.",
        "Sacro Servo Corpus Submissum no se escucha. Se atraviesa."
      ],
      listenUrl: "https://archive.org/details/libreto_202604",
      downloadUrl: "https://archive.org/details/libreto_202604",
      featured: true
    }
  ]
};

window.CorrosionProjects = {
  sacro: {
    platforms: [
      {
        label: "Youtube",
        mark: "YT",
        url: "https://youtube.com/@corrosionlabs?si=sctskkTcgdJed9Yc"
      },
      {
        label: "SoundCloud",
        mark: "SC",
        url: "https://soundcloud.com/sacro-servo"
      },
      {
        label: "Archive.org",
        mark: "AR",
        url: "https://archive.org/search?query=creator%3A%22Corrosion+Labs%22"
      }
    ]
  },
  zero: {
    platforms: [
      {
        label: "Youtube",
        mark: "YT",
        url: "https://youtube.com/@corrosionlabs?si=sctskkTcgdJed9Yc"
      },
      {
        label: "Archive.org",
        mark: "AR",
        url: "https://archive.org/details/zero-sala.-ingravedad_202603"
      }
    ]
  },
  corpus: {
    platforms: [
      {
        label: "Youtube",
        mark: "YT",
        url: "https://youtube.com/@corrosionlabs?si=sctskkTcgdJed9Yc"
      },
      {
        label: "Archive.org",
        mark: "AR",
        url: "https://archive.org/search?query=creator%3A%22Corrosion+Labs%22"
      }
    ]
  }
};
