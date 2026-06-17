import {
  APP_CONFIG,
  FALLBACK_MANIFEST,
  FALLBACK_PHRASES
} from "./config.js";
import { AudioEngine } from "./audioEngine.js";
import { LayerManager } from "./layerManager.js";
import { PhraseEngine } from "./phraseEngine.js";

const startButton = document.querySelector("[data-start]");
const phraseNode = document.querySelector("[data-phrase]");
const statusNode = document.querySelector("[data-status]");
const stateNode = document.querySelector("[data-state]");
const experienceNode = document.querySelector(".experience");

const audioEngine = new AudioEngine({
  onStatus: updateStatus
});

const phraseEngine = new PhraseEngine({
  container: phraseNode,
  phrases: FALLBACK_PHRASES
});

const layerManager = new LayerManager({
  audioEngine,
  manifest: FALLBACK_MANIFEST,
  onStatus: updateStatus,
  onStateChange: updateState
});

async function boot() {
  const [manifest, phrases] = await Promise.all([
    loadJson("./data/audioManifest.json", FALLBACK_MANIFEST),
    loadJson("./data/phrases.json", FALLBACK_PHRASES)
  ]);

  phraseEngine.setPhrases(phrases);
  layerManager.setManifest(manifest);
  updateStatus("Local doctrine loaded. Awaiting acoustic consent.");
}

async function startExperience() {
  startButton.disabled = true;
  updateStatus("Opening the membrane...");

  try {
    await audioEngine.init();
    await audioEngine.resume();
    await audioEngine.preloadManifest(layerManager.manifest);

    phraseEngine.start();
    layerManager.start();

    experienceNode.classList.add("is-active");
    startButton.classList.add("is-hidden");
    updateStatus("The organism is listening.");
  } catch (error) {
    console.error(error);
    startButton.disabled = false;
    updateStatus("This browser rejected the ritual. Check Web Audio support.");
  }
}

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Unable to fetch ${path}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`${path} unavailable, using fallback data.`, error);
    return fallback;
  }
}

function updateStatus(message) {
  if (statusNode) {
    statusNode.textContent = message;
  }
}

function updateState(label) {
  if (stateNode) {
    stateNode.textContent = label;
  }
}

startButton?.addEventListener("click", startExperience);

window.addEventListener("beforeunload", () => {
  phraseEngine.stop();
  layerManager.stop();
});

boot();
