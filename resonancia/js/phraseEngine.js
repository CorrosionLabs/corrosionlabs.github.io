import { APP_CONFIG } from "./config.js";
import { pickRandom, randomBetween } from "./random.js";

export class PhraseEngine {
  constructor({ container, phrases = [], onPhrase }) {
    this.container = container;
    this.phrases = phrases;
    this.onPhrase = onPhrase;
    this.timeoutId = null;
    this.lastPhrase = null;
    this.running = false;
  }

  setPhrases(phrases) {
    this.phrases = Array.isArray(phrases) ? phrases : [];
  }

  start() {
    if (this.running || !this.container) {
      return;
    }

    this.running = true;
    this.scheduleNext(400);
  }

  stop() {
    this.running = false;
    window.clearTimeout(this.timeoutId);
    this.timeoutId = null;
    this.hidePhrase();
  }

  scheduleNext(delay) {
    this.timeoutId = window.setTimeout(() => {
      if (!this.running) {
        return;
      }

      this.showPhrase();
    }, delay);
  }

  showPhrase() {
    const phrase = pickRandom(this.phrases, this.lastPhrase);

    if (!phrase) {
      this.scheduleNext(APP_CONFIG.phrase.intervalMs[0]);
      return;
    }

    this.lastPhrase = phrase;
    this.container.textContent = phrase;
    this.container.classList.add("is-visible");
    this.onPhrase?.(phrase);

    const visibleDuration = randomBetween(
      APP_CONFIG.phrase.visibleMs[0],
      APP_CONFIG.phrase.visibleMs[1]
    );

    this.timeoutId = window.setTimeout(() => {
      this.hidePhrase();

      const nextDelay = randomBetween(
        APP_CONFIG.phrase.intervalMs[0],
        APP_CONFIG.phrase.intervalMs[1]
      );

      this.scheduleNext(nextDelay);
    }, visibleDuration);
  }

  hidePhrase() {
    this.container?.classList.remove("is-visible");
  }
}
