import { APP_CONFIG } from "./config.js";
import { clamp, randomBetween } from "./random.js";

export class AudioEngine {
  constructor({ onStatus } = {}) {
    this.onStatus = onStatus;
    this.context = null;
    this.masterGain = null;
    this.dryGain = null;
    this.reverbInput = null;
    this.delayInput = null;
    this.reverb = null;
    this.delay = null;
    this.limiter = null;
    this.buffers = new Map();
    this.failedFiles = new Set();
    this.activeVoices = new Map();
    this.voiceCounter = 0;
  }

  async init() {
    if (this.context) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser.");
    }

    this.context = new AudioContextClass();
    this.buildGraph();
    this.onStatus?.("Audio context awakened.");
  }

  buildGraph() {
    const context = this.context;

    this.masterGain = context.createGain();
    this.masterGain.gain.value = APP_CONFIG.audio.masterGain;

    this.dryGain = context.createGain();
    this.dryGain.gain.value = 1;

    this.reverbInput = context.createGain();
    this.delayInput = context.createGain();
    this.reverb = context.createConvolver();
    this.reverb.buffer = this.createImpulseResponse(4.2, 2.4);

    this.delay = context.createDelay(4);
    this.delay.delayTime.value = 0.42;

    const feedback = context.createGain();
    feedback.gain.value = 0.26;
    const tone = context.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1800;

    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -16;
    this.limiter.knee.value = 14;
    this.limiter.ratio.value = 4;
    this.limiter.attack.value = 0.02;
    this.limiter.release.value = 0.38;

    this.dryGain.connect(this.masterGain);
    this.reverbInput.connect(this.reverb);
    this.reverb.connect(this.masterGain);
    this.delayInput.connect(this.delay);
    this.delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(this.delay);
    tone.connect(this.masterGain);
    this.masterGain.connect(this.limiter);
    this.limiter.connect(context.destination);
  }

  async resume() {
    if (!this.context) {
      await this.init();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async preloadManifest(manifest = []) {
    const tasks = manifest.map((entry) => this.loadBuffer(entry));
    await Promise.allSettled(tasks);
    return this.buffers;
  }

  async loadBuffer(entry) {
    if (!entry?.file || this.buffers.has(entry.file) || this.failedFiles.has(entry.file)) {
      return this.buffers.get(entry.file) ?? null;
    }

    try {
      const response = await fetch(entry.file);

      if (!response.ok) {
        throw new Error(`Unable to fetch ${entry.file}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(entry.file, audioBuffer);
      return audioBuffer;
    } catch (error) {
      this.failedFiles.add(entry.file);
      this.onStatus?.(`Using synthetic fallback for ${entry.id}.`);
      return null;
    }
  }

  isBufferAvailable(filePath) {
    return this.buffers.has(filePath);
  }

  get now() {
    return this.context?.currentTime ?? 0;
  }

  play(entry, overrides = {}) {
    if (!this.context) {
      throw new Error("AudioEngine is not initialized.");
    }

    if (this.activeVoices.size >= APP_CONFIG.audio.maxConcurrentVoices) {
      this.stopOldestVoice();
    }

    const descriptor = { ...entry, ...overrides };
    const audioBuffer = descriptor.file ? this.buffers.get(descriptor.file) : null;

    if (audioBuffer) {
      return this.playBufferLayer(descriptor, audioBuffer);
    }

    return this.playSyntheticLayer(descriptor);
  }

  playBufferLayer(entry, buffer) {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = Boolean(entry.loop);
    source.playbackRate.value = randomBetween(
      entry.playbackRateMin ?? 1,
      entry.playbackRateMax ?? 1
    );

    const duration = this.resolveDuration(entry, buffer.duration);
    const offsetWindow = Math.max(0, buffer.duration - 0.01);
    const startOffset = entry.randomStartOffset
      ? randomBetween(0, Math.min(offsetWindow, buffer.duration * entry.randomStartOffset))
      : 0;

    const voice = this.createVoiceGraph(entry);
    source.connect(voice.input);

    const startTime = this.now + 0.02;
    const stopTime = startTime + duration + Math.max(0.1, entry.fadeOut ?? 0);

    this.scheduleEnvelope({
      gainNode: voice.gain,
      startTime,
      duration,
      fadeIn: entry.fadeIn ?? 0,
      fadeOut: entry.fadeOut ?? 0,
      targetGain: this.resolveGain(entry)
    });

    source.start(startTime, startOffset);
    source.stop(stopTime);

    const voiceId = this.registerVoice({ source, stopTime, cleanup: voice.cleanup });
    return { voiceId, duration };
  }

  playSyntheticLayer(entry) {
    const archetype = entry.archetype ?? entry.category;
    const voice = this.createVoiceGraph(entry);
    const duration = this.resolveDuration(entry, this.resolveSyntheticBaseDuration(archetype));
    const stopTime = this.now + duration + Math.max(0.1, entry.fadeOut ?? 0) + 0.1;
    const nodes = this.createSyntheticNodes(archetype, voice.input);

    this.scheduleEnvelope({
      gainNode: voice.gain,
      startTime: this.now + 0.02,
      duration,
      fadeIn: entry.fadeIn ?? 0,
      fadeOut: entry.fadeOut ?? 0,
      targetGain: this.resolveGain(entry)
    });

    nodes.forEach((node) => {
      if (typeof node.start === "function") {
        node.start(this.now + 0.02);
      }

      if (typeof node.stop === "function") {
        node.stop(stopTime);
      }
    });

    const voiceId = this.registerVoice({
      source: nodes[0],
      stopTime,
      cleanup: () => {
        voice.cleanup();
        nodes.forEach((node) => {
          try {
            node.disconnect?.();
          } catch (error) {
            return error;
          }
        });
      }
    });
    return { voiceId, duration };
  }

  createVoiceGraph(entry) {
    const input = this.context.createGain();
    const gain = this.context.createGain();
    gain.gain.value = 0.0001;

    const pan = this.context.createStereoPanner();
    pan.pan.value = randomBetween(entry.panMin ?? 0, entry.panMax ?? 0);

    const highpass = this.context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = clamp(
      randomBetween(entry.highpassMin ?? 20, entry.highpassMax ?? entry.highpassMin ?? 20),
      10,
      18000
    );

    const lowpass = this.context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = clamp(
      randomBetween(entry.lowpassMin ?? 18000, entry.lowpassMax ?? entry.lowpassMin ?? 18000),
      40,
      20000
    );

    const shaper = this.context.createWaveShaper();
    shaper.curve = this.createSaturationCurve(entry.saturation ?? 0);
    shaper.oversample = "2x";

    const reverbSend = this.context.createGain();
    reverbSend.gain.value = clamp(entry.reverbSend ?? 0, 0, 1);

    const delaySend = this.context.createGain();
    delaySend.gain.value = clamp(entry.delaySend ?? 0, 0, 1);

    input.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(shaper);
    shaper.connect(pan);
    pan.connect(gain);
    gain.connect(this.dryGain);
    gain.connect(reverbSend);
    gain.connect(delaySend);
    reverbSend.connect(this.reverbInput);
    delaySend.connect(this.delayInput);

    return {
      input,
      gain,
      cleanup: () => {
        input.disconnect();
        highpass.disconnect();
        lowpass.disconnect();
        shaper.disconnect();
        pan.disconnect();
        gain.disconnect();
        reverbSend.disconnect();
        delaySend.disconnect();
      }
    };
  }

  scheduleEnvelope({ gainNode, startTime, duration, fadeIn, fadeOut, targetGain }) {
    const safeFadeIn = Math.max(0.01, fadeIn);
    const safeFadeOut = Math.max(0.01, fadeOut);
    const sustainEnd = startTime + Math.max(0.05, duration);
    const fadeOutStart = Math.max(startTime + safeFadeIn, sustainEnd - safeFadeOut);

    gainNode.gain.cancelScheduledValues(startTime);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, startTime + safeFadeIn);
    gainNode.gain.setValueAtTime(targetGain, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0.0001, sustainEnd);
  }

  registerVoice({ source, stopTime, cleanup }) {
    const id = `voice_${this.voiceCounter += 1}`;

    const release = () => {
      cleanup?.();
      this.activeVoices.delete(id);
      source.removeEventListener?.("ended", release);
    };

    source.addEventListener?.("ended", release);

    this.activeVoices.set(id, {
      id,
      stopTime,
      source,
      cleanup: release
    });

    return id;
  }

  stopOldestVoice() {
    const oldest = [...this.activeVoices.values()].sort((a, b) => a.stopTime - b.stopTime)[0];

    if (!oldest) {
      return;
    }

    try {
      oldest.source.stop();
    } catch (error) {
      oldest.cleanup();
    }
  }

  resolveGain(entry) {
    const base = entry.volume ?? 0.35;
    return clamp(base * randomBetween(0.86, 1.16), 0.02, 1);
  }

  resolveDuration(entry, fallbackDuration = 10) {
    if (typeof entry.minDuration === "number" || typeof entry.maxDuration === "number") {
      const min = entry.minDuration ?? entry.maxDuration ?? fallbackDuration;
      const max = entry.maxDuration ?? entry.minDuration ?? fallbackDuration;
      return randomBetween(min, max);
    }

    return fallbackDuration;
  }

  resolveSyntheticBaseDuration(archetype) {
    const map = {
      sine_drone: 72,
      filtered_noise: 24,
      breath: 10,
      choir: 24,
      interference: 8,
      pulse: 9,
      melodic: 16,
      ritual: 9
    };

    return map[archetype] ?? 12;
  }

  createSyntheticNodes(archetype, destination) {
    const context = this.context;

    switch (archetype) {
      case "sine_drone":
        return this.createDroneNodes(context, destination);
      case "filtered_noise":
        return this.createNoiseNodes(context, destination);
      case "breath":
        return this.createBreathNodes(context, destination);
      case "choir":
        return this.createChoirNodes(context, destination);
      case "interference":
        return this.createInterferenceNodes(context, destination);
      case "pulse":
        return this.createPulseNodes(context, destination);
      case "melodic":
        return this.createMelodicNodes(context, destination);
      case "ritual":
        return this.createRitualNodes(context, destination);
      default:
        return this.createNoiseNodes(context, destination);
    }
  }

  createDroneNodes(context, destination) {
    const oscA = context.createOscillator();
    const oscB = context.createOscillator();
    const mod = context.createOscillator();
    const modGain = context.createGain();
    const blend = context.createGain();

    oscA.type = "sine";
    oscB.type = "triangle";
    mod.type = "sine";
    oscA.frequency.value = randomBetween(42, 68);
    oscB.frequency.value = oscA.frequency.value * randomBetween(0.49, 1.01);
    mod.frequency.value = randomBetween(0.03, 0.08);
    modGain.gain.value = randomBetween(1, 4);
    blend.gain.value = 0.5;

    mod.connect(modGain);
    modGain.connect(oscB.frequency);
    oscA.connect(blend);
    oscB.connect(blend);
    blend.connect(destination);

    return [oscA, oscB, mod];
  }

  createNoiseNodes(context, destination) {
    const source = context.createBufferSource();
    source.buffer = this.createNoiseBuffer(3.5);
    source.loop = true;

    const wobble = context.createBiquadFilter();
    wobble.type = "bandpass";
    wobble.frequency.value = randomBetween(300, 1000);
    wobble.Q.value = randomBetween(0.5, 2.4);

    source.connect(wobble);
    wobble.connect(destination);

    return [source];
  }

  createBreathNodes(context, destination) {
    const source = context.createBufferSource();
    source.buffer = this.createNoiseBuffer(2.2);

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = randomBetween(600, 1600);
    filter.Q.value = 1.3;

    source.connect(filter);
    filter.connect(destination);

    return [source];
  }

  createChoirNodes(context, destination) {
    const oscA = context.createOscillator();
    const oscB = context.createOscillator();
    const oscC = context.createOscillator();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const mix = context.createGain();

    const root = randomBetween(130, 220);
    oscA.type = "sine";
    oscB.type = "sine";
    oscC.type = "triangle";
    oscA.frequency.value = root;
    oscB.frequency.value = root * 1.5;
    oscC.frequency.value = root * 2;
    lfo.type = "sine";
    lfo.frequency.value = randomBetween(0.08, 0.16);
    lfoGain.gain.value = randomBetween(1.2, 3.4);
    mix.gain.value = 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(oscB.detune);
    oscA.connect(mix);
    oscB.connect(mix);
    oscC.connect(mix);
    mix.connect(destination);

    return [oscA, oscB, oscC, lfo];
  }

  createInterferenceNodes(context, destination) {
    const osc = context.createOscillator();
    const source = context.createBufferSource();
    const mix = context.createGain();

    osc.type = "square";
    osc.frequency.value = randomBetween(1200, 4200);
    source.buffer = this.createNoiseBuffer(1.5);
    source.loop = true;
    mix.gain.value = 0.5;

    osc.connect(mix);
    source.connect(mix);
    mix.connect(destination);

    return [osc, source];
  }

  createPulseNodes(context, destination) {
    const osc = context.createOscillator();
    const amp = context.createGain();
    const pulse = context.createOscillator();
    const pulseGain = context.createGain();

    osc.type = "triangle";
    osc.frequency.value = randomBetween(54, 90);
    amp.gain.value = 0.2;
    pulse.type = "square";
    pulse.frequency.value = randomBetween(0.7, 1.4);
    pulseGain.gain.value = 0.18;

    pulse.connect(pulseGain);
    pulseGain.connect(amp.gain);
    osc.connect(amp);
    amp.connect(destination);

    return [osc, pulse];
  }

  createMelodicNodes(context, destination) {
    const osc = context.createOscillator();
    const shimmer = context.createOscillator();
    const mix = context.createGain();

    const ratios = [1, 1.125, 1.333, 1.5];
    const root = randomBetween(180, 260);
    osc.type = "triangle";
    shimmer.type = "sine";
    osc.frequency.value = root * ratios[Math.floor(Math.random() * ratios.length)];
    shimmer.frequency.value = osc.frequency.value * 2;
    mix.gain.value = 0.26;

    osc.connect(mix);
    shimmer.connect(mix);
    mix.connect(destination);

    return [osc, shimmer];
  }

  createRitualNodes(context, destination) {
    const osc = context.createOscillator();
    const partial = context.createOscillator();
    const mix = context.createGain();

    osc.type = "triangle";
    partial.type = "sine";
    osc.frequency.value = randomBetween(360, 640);
    partial.frequency.value = osc.frequency.value * 1.98;
    mix.gain.value = 0.22;

    osc.connect(mix);
    partial.connect(mix);
    mix.connect(destination);

    return [osc, partial];
  }

  createNoiseBuffer(durationSeconds) {
    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * durationSeconds));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * randomBetween(0.12, 0.92);
    }

    return buffer;
  }

  createImpulseResponse(durationSeconds, decay) {
    const frameCount = Math.floor(this.context.sampleRate * durationSeconds);
    const impulse = this.context.createBuffer(2, frameCount, this.context.sampleRate);

    for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
      const channel = impulse.getChannelData(channelIndex);

      for (let index = 0; index < frameCount; index += 1) {
        const reverseIndex = frameCount - index;
        channel[index] = (Math.random() * 2 - 1) * (reverseIndex / frameCount) ** decay;
      }
    }

    return impulse;
  }

  createSaturationCurve(amount) {
    const safeAmount = clamp(amount, 0, 1);
    const samples = 2048;
    const curve = new Float32Array(samples);
    const drive = 1 + safeAmount * 18;

    for (let index = 0; index < samples; index += 1) {
      const x = (index * 2) / samples - 1;
      curve[index] = ((3 + drive) * x * 20 * (Math.PI / 180)) / (Math.PI + drive * Math.abs(x));
    }

    return curve;
  }
}
