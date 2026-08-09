(function () {
  var titleElement = document.getElementById("collider-title");
  var subtitleElement = document.getElementById("collider-subtitle");
  var resultElementEs = document.getElementById("collider-result-es");
  var resultElementEn = document.getElementById("collider-result-en");
  var statusElement = document.getElementById("collider-status");
  var collideButton = document.getElementById("collide-button");
  var decks = [];
  var currentSelection = null;
  var state = "loading";
  var animationFrameId = 0;
  var animationToken = 0;
  var glitchTimeoutId = 0;
  var wordPoolEs = [];
  var wordPoolEn = [];
  // Tiempo dedicado a la busqueda y fijacion de cada palabra.
  var COLLIDER_WORD_REVEAL_DELAY_MS = 120;
  // Numero de palabras candidatas que se muestran antes de fijar la palabra definitiva.
  var COLLIDER_WORD_SEARCH_STEPS = 50;
  // Tiempo minimo que dura el glitch cuando el texto ya esta quieto.
  var COLLIDER_GLITCH_DURATION_MIN_MS = 120;
  // Variacion aleatoria adicional sobre la duracion minima del glitch.
  var COLLIDER_GLITCH_DURATION_RANGE_MS = 160;
  // Espera minima antes de lanzar un nuevo glitch idle.
  var COLLIDER_GLITCH_DELAY_MIN_MS = 700;
  // Variacion aleatoria adicional sobre la espera minima entre glitches.
  var COLLIDER_GLITCH_DELAY_RANGE_MS = 1400;

  var copy = {
    documentTitle: "Colisionador de Ideas | Corrosion Labs",
    pageTitle: "COLISIONADOR DE IDEAS",
    subtitle: "ELEMENTOS INCOMPATIBLES. REACCIONES CORROSIVAS.",
    collide: "COLISIONAR",
    loadingEs: "Cargando mazos...",
    loadingEn: "Loading decks...",
    errorEs: "No se pudieron cargar los mazos.",
    errorEn: "Could not load the decks.",
    errorHint: "Comprueba idea-collider/decks.json.",
    ready: "Pulsa COLISIONAR para generar una nueva combinacion."
  };

  function randomIndex(length) {
    return Math.floor(Math.random() * length);
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function capitalizeFirst(value) {
    if (!value) {
      return "";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function getRevealOrder(targetParts) {
    var indices = [];
    var i = 0;

    for (i = 0; i < targetParts.length; i += 1) {
      if (targetParts[i]) {
        indices.push(i);
      }
    }

    for (i = indices.length - 1; i > 0; i -= 1) {
      var swapIndex = Math.floor(Math.random() * (i + 1));
      var current = indices[i];

      indices[i] = indices[swapIndex];
      indices[swapIndex] = current;
    }

    return indices;
  }

  function getWordParts(target) {
    return target.split(" ");
  }

  function stripWordPunctuation(token) {
    return token.replace(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/g, "");
  }

  function getWordDecoration(token) {
    var match = token.match(/^([^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)(.*?)([^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)$/);

    if (!match) {
      return { prefix: "", suffix: "" };
    }

    return {
      prefix: match[1] || "",
      suffix: match[3] || ""
    };
  }

  function getRandomWord(token, pool) {
    var cleanPool = pool.filter(Boolean);
    var decoration = getWordDecoration(token);
    var replacement = "";

    if (cleanPool.length) {
      replacement = cleanPool[randomIndex(cleanPool.length)];
    } else {
      replacement = stripWordPunctuation(token) || token;
    }

    return decoration.prefix + replacement + decoration.suffix;
  }

  function getSearchWord(token, pool, pendingIndex, searchStep) {
    var cleanPool = pool.filter(Boolean);
    var decoration = getWordDecoration(token);
    var replacement = "";
    var seededIndex = 0;

    if (!cleanPool.length) {
      replacement = stripWordPunctuation(token) || token;
      return decoration.prefix + replacement + decoration.suffix;
    }

    seededIndex = (pendingIndex * 17 + searchStep * 31 + animationToken * 13) % cleanPool.length;
    replacement = cleanPool[seededIndex];
    return decoration.prefix + replacement + decoration.suffix;
  }

  function renderScramble(target, revealProgress, revealOrder, pool) {
    var targetParts = getWordParts(target);
    var exactReveal = Math.max(0, Math.min(revealProgress, revealOrder.length));
    var revealedCount = Math.floor(exactReveal);
    var partialReveal = exactReveal - revealedCount;
    var revealedMap = {};
    var latestRevealedIndex = -1;
    var pendingIndex = -1;
    var searchStep = 0;
    var output = [];
    var i = 0;

    for (i = 0; i < revealedCount; i += 1) {
      revealedMap[revealOrder[i]] = true;
    }

    if (revealedCount > 0) {
      latestRevealedIndex = revealOrder[revealedCount - 1];
    }

    if (revealedCount < revealOrder.length && exactReveal < revealOrder.length) {
      pendingIndex = revealOrder[revealedCount];
      searchStep = Math.min(
        Math.floor(partialReveal * COLLIDER_WORD_SEARCH_STEPS),
        Math.max(COLLIDER_WORD_SEARCH_STEPS - 1, 0)
      );
    }

    for (i = 0; i < targetParts.length; i += 1) {
      if (revealedMap[i]) {
        output.push(
          '<span class="' +
          (i === latestRevealedIndex ? "collider-word-inserted" : "collider-word-fixed") +
          '">' +
          escapeHtml(targetParts[i]) +
          "</span>"
        );
      } else if (i === pendingIndex) {
        output.push('<span class="strategy-char-pending">' +
          escapeHtml(getSearchWord(targetParts[i], pool, pendingIndex, searchStep)) +
          "</span>");
      }
    }

    return output.join(" ");
  }

  function updateStaticCopy() {
    var heading = document.getElementById("result-heading");

    document.documentElement.lang = "es";
    document.title = copy.documentTitle;
    titleElement.textContent = copy.pageTitle;
    subtitleElement.textContent = copy.subtitle;
    collideButton.textContent = copy.collide;
    heading.textContent = "Resultado";
  }

  function buildSentence(language) {
    var selectedById = {};
    var concept;
    var objectItem;
    var contextItem;
    var rule;
    var aestheticTone;
    var mutation;

    currentSelection.forEach(function (entry) {
      selectedById[entry.id] = entry.item[language];
    });

    concept = capitalizeFirst(selectedById.concept || "");
    objectItem = selectedById.object || "";
    contextItem = selectedById.context || "";
    rule = capitalizeFirst(selectedById.rule || "");
    aestheticTone = capitalizeFirst(selectedById["aesthetic-tone"] || "");
    mutation = capitalizeFirst(selectedById.mutation || "");

    return concept + ": " + objectItem + " " + contextItem + ". " + rule + ". (" + aestheticTone + ". " + mutation + ")";
  }

  function selectRandomCollision() {
    currentSelection = decks.map(function (deck) {
      return {
        id: deck.id,
        label: deck.label,
        item: deck.items[randomIndex(deck.items.length)]
      };
    });
  }

  function triggerIdleGlitch(token) {
    if (token !== animationToken) {
      return;
    }

    resultElementEs.classList.add("is-glitching");
    resultElementEn.classList.add("is-glitching");
    resultElementEs.style.setProperty("--glitch-shift", (Math.random() * 2.4 - 1.2).toFixed(2) + "px");
    resultElementEn.style.setProperty("--glitch-shift", (Math.random() * 2.4 - 1.2).toFixed(2) + "px");

    window.setTimeout(function () {
      if (token !== animationToken) {
        return;
      }

      resultElementEs.classList.remove("is-glitching");
      resultElementEn.classList.remove("is-glitching");
      scheduleIdleGlitch(token);
    }, COLLIDER_GLITCH_DURATION_MIN_MS + Math.random() * COLLIDER_GLITCH_DURATION_RANGE_MS);
  }

  function scheduleIdleGlitch(token) {
    clearTimeout(glitchTimeoutId);
    glitchTimeoutId = window.setTimeout(function () {
      triggerIdleGlitch(token);
    }, COLLIDER_GLITCH_DELAY_MIN_MS + Math.random() * COLLIDER_GLITCH_DELAY_RANGE_MS);
  }

  function animateSelection(textEs, textEn) {
    var start = 0;
    var token = animationToken + 1;
    var revealOrderEs = getRevealOrder(getWordParts(textEs));
    var revealOrderEn = getRevealOrder(getWordParts(textEn));
    var totalWords = Math.max(revealOrderEs.length, revealOrderEn.length);
    var duration = Math.max(totalWords * COLLIDER_WORD_REVEAL_DELAY_MS, COLLIDER_WORD_REVEAL_DELAY_MS);

    animationToken = token;
    cancelAnimationFrame(animationFrameId);
    clearTimeout(glitchTimeoutId);
    resultElementEs.classList.remove("is-glitching");
    resultElementEn.classList.remove("is-glitching");
    collideButton.disabled = true;

    function step(timestamp) {
      var elapsed = 0;
      var revealProgress = 0;

      if (!start) {
        start = timestamp;
      }

      elapsed = Math.min(timestamp - start, duration);
      revealProgress = elapsed / COLLIDER_WORD_REVEAL_DELAY_MS;
      resultElementEs.innerHTML = renderScramble(textEs, revealProgress, revealOrderEs, wordPoolEs);
      resultElementEn.innerHTML = renderScramble(textEn, revealProgress, revealOrderEn, wordPoolEn);

      if (elapsed < duration && token === animationToken) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      resultElementEs.textContent = textEs;
      resultElementEn.textContent = textEn;
      resultElementEs.setAttribute("data-text", textEs);
      resultElementEn.setAttribute("data-text", textEn);
      collideButton.disabled = false;
      scheduleIdleGlitch(token);
    }

    animationFrameId = requestAnimationFrame(step);
  }

  function renderSelection() {
    var textEs;
    var textEn;

    if (!currentSelection) {
      return;
    }

    textEs = buildSentence("es");
    textEn = buildSentence("en");
    animateSelection(textEs, textEn);
    statusElement.textContent = copy.ready;
  }

  function runCollision() {
    if (!decks.length) {
      return;
    }

    state = "ready";
    selectRandomCollision();
    renderSelection();
  }

  function showError() {
    state = "error";
    currentSelection = null;
    resultElementEs.textContent = copy.errorEs;
    resultElementEn.textContent = copy.errorEn;
    resultElementEs.setAttribute("data-text", copy.errorEs);
    resultElementEn.setAttribute("data-text", copy.errorEn);
    statusElement.textContent = copy.errorHint;
    collideButton.disabled = true;
  }

  function isValidDeck(deck) {
    return Boolean(
      deck &&
      typeof deck.id === "string" &&
      deck.label &&
      typeof deck.label.es === "string" &&
      typeof deck.label.en === "string" &&
      Array.isArray(deck.items) &&
      deck.items.length &&
      deck.items.every(function (item) {
        return item && typeof item.es === "string" && typeof item.en === "string";
      })
    );
  }

  function buildWordPool(language) {
    var pool = [];

    decks.forEach(function (deck) {
      deck.items.forEach(function (item) {
        getWordParts(item[language]).forEach(function (token) {
          var cleanToken = stripWordPunctuation(token);

          if (cleanToken) {
            pool.push(cleanToken);
          }
        });
      });
    });

    return pool;
  }

  updateStaticCopy();
  resultElementEs.textContent = copy.loadingEs;
  resultElementEn.textContent = copy.loadingEn;
  resultElementEs.setAttribute("data-text", copy.loadingEs);
  resultElementEn.setAttribute("data-text", copy.loadingEn);

  fetch("decks.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Request failed");
      }

      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error("Invalid decks data");
      }

      decks = data.filter(isValidDeck);

      if (!decks.length) {
        throw new Error("No valid decks");
      }

      wordPoolEs = buildWordPool("es");
      wordPoolEn = buildWordPool("en");
      runCollision();
      collideButton.addEventListener("click", runCollision);
    })
    .catch(showError);
}());
