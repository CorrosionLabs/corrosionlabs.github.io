import { CATEGORY_DEFINITIONS, ORGANISM_STATES } from "./config.js";
import { randomBetween, weightedPick } from "./random.js";

export class LayerManager {
  constructor({ audioEngine, manifest = [], onStatus, onStateChange }) {
    this.audioEngine = audioEngine;
    this.manifest = manifest;
    this.onStatus = onStatus;
    this.onStateChange = onStateChange;
    this.running = false;
    this.timers = new Map();
    this.cooldowns = new Map();
    this.activeByCategory = new Map();
    this.stateKeys = Object.keys(ORGANISM_STATES);
    this.currentStateKey = this.stateKeys[0];
    this.stateTimer = null;
  }

  setManifest(manifest) {
    this.manifest = Array.isArray(manifest) ? manifest : [];
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.enterState(this.currentStateKey);

    Object.keys(CATEGORY_DEFINITIONS).forEach((category) => {
      this.activeByCategory.set(category, 0);
      this.scheduleCategory(category, randomBetween(500, 1800));
    });
  }

  stop() {
    this.running = false;

    this.timers.forEach((timerId) => window.clearTimeout(timerId));
    this.timers.clear();

    if (this.stateTimer) {
      window.clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }
  }

  scheduleCategory(category, delayMs) {
    const timerId = window.setTimeout(() => {
      if (!this.running) {
        return;
      }

      this.processCategory(category);
    }, delayMs);

    this.timers.set(category, timerId);
  }

  processCategory(category) {
    const definition = CATEGORY_DEFINITIONS[category];
    const activeCount = this.activeByCategory.get(category) ?? 0;
    const shouldForce = activeCount < definition.minConcurrent;
    const chance = this.resolveCategoryProbability(category);

    if (shouldForce || Math.random() <= chance) {
      const selection = this.pickEntryForCategory(category);

      if (selection) {
        this.spawnEntry(selection);
      }
    }

    const nextDelay = randomBetween(
      definition.spawnIntervalMs[0],
      definition.spawnIntervalMs[1]
    );

    this.scheduleCategory(category, nextDelay);
  }

  resolveCategoryProbability(category) {
    const definition = CATEGORY_DEFINITIONS[category];
    const state = ORGANISM_STATES[this.currentStateKey];
    const bias = state?.categoryBias?.[category] ?? 1;
    return Math.min(1, definition.baseProbability * bias * 0.65);
  }

  pickEntryForCategory(category) {
    const nowSeconds = performance.now() / 1000;
    const definition = CATEGORY_DEFINITIONS[category];
    const activeCount = this.activeByCategory.get(category) ?? 0;

    if (activeCount >= definition.maxConcurrent) {
      return null;
    }

    const candidates = this.manifest.filter((entry) => {
      if (entry.category !== category) {
        return false;
      }

      const availableAt = this.cooldowns.get(entry.id) ?? 0;
      return nowSeconds >= availableAt;
    });

    return weightedPick(candidates, (entry) => this.resolveWeightedBias(entry));
  }

  resolveWeightedBias(entry) {
    const state = ORGANISM_STATES[this.currentStateKey];
    const categoryBias = state?.categoryBias?.[entry.category] ?? 1;
    return (entry.weight ?? 1) * categoryBias;
  }

  spawnEntry(entry) {
    const playback = this.audioEngine.play(entry);
    const activeCount = this.activeByCategory.get(entry.category) ?? 0;
    this.activeByCategory.set(entry.category, activeCount + 1);

    const nowSeconds = performance.now() / 1000;
    this.cooldowns.set(entry.id, nowSeconds + (entry.cooldown ?? 0));

    const durationSeconds = playback?.duration ?? entry.maxDuration ?? entry.minDuration ?? 12;
    const fadeOut = entry.fadeOut ?? 0;
    const releaseMs = (durationSeconds + fadeOut + 0.25) * 1000;

    window.setTimeout(() => {
      const current = this.activeByCategory.get(entry.category) ?? 1;
      this.activeByCategory.set(entry.category, Math.max(0, current - 1));
    }, releaseMs);

    this.onStatus?.(`Layer invoked: ${entry.id}`);
    return playback?.voiceId ?? null;
  }

  enterState(stateKey) {
    this.currentStateKey = stateKey;
    const state = ORGANISM_STATES[stateKey];
    this.onStateChange?.(state.label);
    this.onStatus?.(`State shift: ${state.label}`);

    const duration = randomBetween(state.durationMs[0], state.durationMs[1]);
    this.stateTimer = window.setTimeout(() => {
      if (!this.running) {
        return;
      }

      this.rotateState();
    }, duration);
  }

  rotateState() {
    const currentIndex = this.stateKeys.indexOf(this.currentStateKey);
    const nextKey = this.stateKeys[(currentIndex + 1) % this.stateKeys.length];
    this.enterState(nextKey);
  }
}
