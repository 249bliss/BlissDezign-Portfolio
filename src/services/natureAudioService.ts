// Procedural Web Audio Atmospheric Sky & Jet Synthesizer (Moving Cloud Waves & Distant Jet Flyby)
class SkyAudioService {
  private ctx: AudioContext | null = null;
  private cloudGain: GainNode | null = null;
  private jetTimer: number | null = null;
  private initialJetTimer: number | null = null;
  private activeJetGains: GainNode[] = [];
  private playing = false;
  private listeners: ((playing: boolean) => void)[] = [];

  public isPlaying(): boolean {
    return this.playing;
  }

  public subscribe(listener: (playing: boolean) => void): () => void {
    this.listeners.push(listener);
    listener(this.playing);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.playing));
  }

  private initAudio() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    this.ctx = ctx;

    // ─────────────────────────────────────────────────────────
    // 1. ROLLING CLOUD WAVES & HIGH-ALTITUDE AERIAL AIR CURRENTS
    // ─────────────────────────────────────────────────────────
    const sampleRate = ctx.sampleRate;
    const bufferDuration = 6.0;
    const bufferSize = Math.floor(sampleRate * bufferDuration);
    const noiseBuffer = ctx.createBuffer(2, bufferSize, sampleRate); // Stereo buffer

    // Generate warm, organic pink/brown noise
    for (let ch = 0; ch < 2; ch++) {
      const output = noiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.153852;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.15;
        b6 = white * 0.115926;
      }
    }

    const cloudNoise = ctx.createBufferSource();
    cloudNoise.buffer = noiseBuffer;
    cloudNoise.loop = true;

    // Dual cascading filters to give a deep, soft cloud atmosphere
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 360;
    lowFilter.Q.value = 2.0;

    const airyFilter = ctx.createBiquadFilter();
    airyFilter.type = 'bandpass';
    airyFilter.frequency.value = 460;
    airyFilter.Q.value = 1.2;

    const cloudGain = ctx.createGain();
    cloudGain.gain.value = 0;
    this.cloudGain = cloudGain;

    // Slow organic LFO mimicking breathing cloud waves (0.075 Hz ≈ 13.3s wave period)
    const waveLfo = ctx.createOscillator();
    waveLfo.type = 'sine';
    waveLfo.frequency.value = 0.075;

    const waveLfoGain = ctx.createGain();
    waveLfoGain.gain.value = 110;

    waveLfo.connect(waveLfoGain);
    waveLfoGain.connect(lowFilter.frequency);
    waveLfoGain.connect(airyFilter.frequency);
    waveLfo.start();

    cloudNoise.connect(lowFilter);
    lowFilter.connect(airyFilter);
    airyFilter.connect(cloudGain);
    cloudGain.connect(ctx.destination);
    cloudNoise.start();
  }

  // ─────────────────────────────────────────────────────────
  // 2. DISTANT JET PASSING BY (TURBINE DRONE, AIRFLOW, DOPPLER, STEREO PAN)
  // ─────────────────────────────────────────────────────────
  private triggerJetFlyby = () => {
    if (!this.playing || !this.ctx) return;
    if (this.ctx.state === 'suspended') return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 12.0; // 12-second panoramic pass-by
    const peakTime = now + 4.8;
    const endTime = now + duration;

    // Randomize flyby direction (left-to-right or right-to-left)
    const flyDirection = Math.random() > 0.5 ? 1 : -1;
    const startPan = -0.88 * flyDirection;
    const endPan = 0.88 * flyDirection;

    // Master gain for this specific jet pass (boosted for audible presence on all devices)
    const jetMasterGain = ctx.createGain();
    jetMasterGain.gain.setValueAtTime(0.0001, now);
    jetMasterGain.gain.linearRampToValueAtTime(0.52, peakTime);
    jetMasterGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    // Stereo Panning for the flyby
    let outputNode: AudioNode = jetMasterGain;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(startPan, now);
      panner.pan.linearRampToValueAtTime(0.0, peakTime);
      panner.pan.linearRampToValueAtTime(endPan, endTime);
      jetMasterGain.connect(panner);
      outputNode = panner;
    }
    outputNode.connect(ctx.destination);

    // A) Low Turbine Engine Fundamental & Audible Fan Harmonics
    const baseFreq = 72.0 + (Math.random() - 0.5) * 8.0; // ~68Hz-76Hz
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const turbineGain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc3.type = 'sine';

    // Doppler Pitch Glide: Starts slightly higher on approach, glides down as it passes overhead
    osc1.frequency.setValueAtTime(baseFreq * 1.08, now);
    osc1.frequency.linearRampToValueAtTime(baseFreq * 1.04, peakTime - 1.2);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.91, peakTime + 2.0);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.86, endTime);

    osc2.frequency.setValueAtTime(baseFreq * 2.08, now);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 2.02, peakTime - 1.2);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.82, peakTime + 2.0);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.74, endTime);

    osc3.frequency.setValueAtTime(baseFreq * 3.4, now);
    osc3.frequency.linearRampToValueAtTime(baseFreq * 3.3, peakTime - 1.2);
    osc3.frequency.exponentialRampToValueAtTime(baseFreq * 2.95, peakTime + 2.0);
    osc3.frequency.exponentialRampToValueAtTime(baseFreq * 2.82, endTime);

    turbineGain.gain.value = 1.0;
    osc1.connect(turbineGain);
    osc2.connect(turbineGain);
    osc3.connect(turbineGain);
    turbineGain.connect(jetMasterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(endTime);
    osc2.stop(endTime);
    osc3.stop(endTime);

    // B) High-Bypass Exhaust Roar & Air Rush
    const noiseBufferSize = Math.floor(ctx.sampleRate * 2.5);
    const jetNoiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
    const noiseData = jetNoiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.85;
    }

    const jetNoise = ctx.createBufferSource();
    jetNoise.buffer = jetNoiseBuffer;
    jetNoise.loop = true;

    // Atmospheric Absorption Filter: high frequencies dampen as aircraft recedes into clouds
    const jetFilter = ctx.createBiquadFilter();
    jetFilter.type = 'bandpass';
    jetFilter.frequency.setValueAtTime(460, now);
    jetFilter.frequency.linearRampToValueAtTime(620, peakTime);
    jetFilter.frequency.exponentialRampToValueAtTime(280, endTime);
    jetFilter.Q.value = 2.0;

    const roarGain = ctx.createGain();
    roarGain.gain.value = 1.5;

    jetNoise.connect(jetFilter);
    jetFilter.connect(roarGain);
    roarGain.connect(jetMasterGain);

    jetNoise.start(now);
    jetNoise.stop(endTime);

    this.activeJetGains.push(jetMasterGain);
    window.setTimeout(() => {
      this.activeJetGains = this.activeJetGains.filter((g) => g !== jetMasterGain);
    }, duration * 1000);

    // Schedule next jet pass-by between 26 and 42 seconds
    const nextFlybyDelay = 26000 + Math.random() * 16000;
    this.jetTimer = window.setTimeout(this.triggerJetFlyby, nextFlybyDelay);
  };

  public toggle() {
    this.initAudio();
    if (!this.ctx) return;

    if (!this.playing) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.playing = true;
      if (this.cloudGain) {
        // Smooth swell into the rolling cloud waves (increased volume)
        this.cloudGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.8);
      }
      // Trigger an initial jet pass-by after 1.2s so the user immediately hears the aircraft!
      this.initialJetTimer = window.setTimeout(() => {
        if (this.playing) {
          this.triggerJetFlyby();
        }
      }, 1200);
    } else {
      this.playing = false;
      if (this.cloudGain && this.ctx) {
        this.cloudGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      // Instantly kill and disconnect any active jet sounds
      this.activeJetGains.forEach((g) => {
        try {
          if (this.ctx) g.gain.setValueAtTime(0, this.ctx.currentTime);
          g.disconnect();
        } catch (_) {}
      });
      this.activeJetGains = [];

      if (this.jetTimer) {
        clearTimeout(this.jetTimer);
        this.jetTimer = null;
      }
      if (this.initialJetTimer) {
        clearTimeout(this.initialJetTimer);
        this.initialJetTimer = null;
      }

      // Suspend audio context immediately to guarantee 100% silence
      if (this.ctx && this.ctx.state !== 'suspended') {
        this.ctx.suspend().catch(() => {});
      }
    }
    this.notify();
  }
}

export const natureAudio = new SkyAudioService();
