(function () {
  var strategyEs = document.getElementById("strategy-es");
  var strategyEn = document.getElementById("strategy-en");
  var strategyStatus = document.getElementById("strategy-status");
  var strategyButton = document.getElementById("strategy-button");
  var previousIndex = -1;
  var cards = [];
  var animationFrameId = 0;
  var animationToken = 0;
  var glitchTimeoutId = 0;
  var randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getRevealOrder(target) {
    var indices = [];
    var i = 0;

    for (i = 0; i < target.length; i += 1) {
      if (target.charAt(i) !== " ") {
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

  function renderScramble(target, progress, revealOrder) {
    var revealedCount = Math.floor(revealOrder.length * progress);
    var revealedMap = {};
    var output = "";
    var i = 0;

    for (i = 0; i < revealedCount; i += 1) {
      revealedMap[revealOrder[i]] = true;
    }

    for (i = 0; i < target.length; i += 1) {
      if (target.charAt(i) === " ") {
        output += " ";
      } else if (revealedMap[i]) {
        output += escapeHtml(target.charAt(i));
      } else {
        output += '<span class="strategy-char-pending">' +
          randomChars.charAt(Math.floor(Math.random() * randomChars.length)) +
          "</span>";
      }
    }

    return output;
  }

  function animateStrategy(card, index) {
    var start = 0;
    var duration = 950;
    var token = animationToken + 1;
    var revealOrderEs = getRevealOrder(card.es);
    var revealOrderEn = getRevealOrder(card.en);

    animationToken = token;
    cancelAnimationFrame(animationFrameId);
    clearTimeout(glitchTimeoutId);
    strategyEs.classList.remove("is-glitching");
    strategyEn.classList.remove("is-glitching");
    strategyButton.disabled = true;

    function step(timestamp) {
      var progress = 0;

      if (!start) {
        start = timestamp;
      }

      progress = Math.min((timestamp - start) / duration, 1);
      strategyEs.innerHTML = renderScramble(card.es, progress, revealOrderEs);
      strategyEn.innerHTML = renderScramble(card.en, progress, revealOrderEn);

      if (progress < 1 && token === animationToken) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      strategyEs.textContent = card.es;
      strategyEn.textContent = card.en;
      strategyEs.setAttribute("data-text", card.es);
      strategyEn.setAttribute("data-text", card.en);
      strategyButton.disabled = false;
      previousIndex = index;
      scheduleIdleGlitch(token);
    }

    strategyStatus.textContent = "";
    animationFrameId = requestAnimationFrame(step);
  }

  function triggerIdleGlitch(token) {
    if (token !== animationToken) {
      return;
    }

    strategyEs.classList.add("is-glitching");
    strategyEn.classList.add("is-glitching");
    strategyEs.style.setProperty("--glitch-shift", (Math.random() * 2.4 - 1.2).toFixed(2) + "px");
    strategyEn.style.setProperty("--glitch-shift", (Math.random() * 2.4 - 1.2).toFixed(2) + "px");

    window.setTimeout(function () {
      if (token !== animationToken) {
        return;
      }

      strategyEs.classList.remove("is-glitching");
      strategyEn.classList.remove("is-glitching");
      scheduleIdleGlitch(token);
    }, 120 + Math.random() * 160);
  }

  function scheduleIdleGlitch(token) {
    clearTimeout(glitchTimeoutId);
    glitchTimeoutId = window.setTimeout(function () {
      triggerIdleGlitch(token);
    }, 700 + Math.random() * 1400);
  }

  function getNextIndex() {
    if (!cards.length) {
      return -1;
    }

    if (cards.length === 1) {
      return 0;
    }

    var nextIndex = previousIndex;
    while (nextIndex === previousIndex) {
      nextIndex = Math.floor(Math.random() * cards.length);
    }
    return nextIndex;
  }

  function showRandomStrategy() {
    var nextIndex = getNextIndex();
    if (nextIndex === -1) {
      return;
    }

    animateStrategy(cards[nextIndex], nextIndex);
  }

  function showErrorState() {
    strategyEs.textContent = "No se pudo cargar la estrategia.";
    strategyEn.textContent = "Could not load the strategy.";
    strategyStatus.textContent = "Check strategies/cards.json.";
    strategyButton.disabled = true;
  }

  fetch("cards.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Request failed");
      }
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data) || !data.length) {
        throw new Error("Invalid cards data");
      }

      cards = data.filter(function (item) {
        return item && typeof item.es === "string" && typeof item.en === "string";
      });

      if (!cards.length) {
        throw new Error("No valid cards");
      }

      showRandomStrategy();
      strategyButton.addEventListener("click", showRandomStrategy);
    })
    .catch(showErrorState);
}());
