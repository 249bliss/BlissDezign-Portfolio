// Procedural Web Audio Nature Sound Synthesizer (Breeze & Birdsong)
class NatureAudioService {
  private ctx: AudioContext | null = null;
  private windGain: GainNode | null = null;
  private timer: number | null = null;
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

    // 1. GENTLE WIND / BREEZE SYNTHESIZER
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.153852;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 380;
    windFilter.Q.value = 2.5;

    const windGain = ctx.createGain();
    windGain.gain.value = 0;
    this.windGain = windGain;

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ctx.destination);
    whiteNoise.start();

    // Wind modulation LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();
  }

  private playBirdChirp = () => {
    if (!this.playing || !this.ctx) return;
    if (this.ctx.state === 'suspended') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 2800 + Math.random() * 800;
    const chirpDuration = 0.12 + Math.random() * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + chirpDuration * 0.4);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + chirpDuration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + chirpDuration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + chirpDuration);

    if (Math.random() > 0.4) {
      setTimeout(() => {
        if (!this.playing || !this.ctx) return;
        const n2 = this.ctx.currentTime;
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();

        o2.type = 'sine';
        o2.frequency.setValueAtTime(baseFreq * 1.1, n2);
        o2.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, n2 + chirpDuration * 0.35);
        o2.frequency.exponentialRampToValueAtTime(baseFreq, n2 + chirpDuration);

        g2.gain.setValueAtTime(0.001, n2);
        g2.gain.linearRampToValueAtTime(0.04, n2 + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.0001, n2 + chirpDuration);

        o2.connect(g2);
        g2.connect(this.ctx.destination);
        o2.start(n2);
        o2.stop(n2 + chirpDuration);
      }, (chirpDuration + 0.06) * 1000);
    }

    const nextInterval = 2000 + Math.random() * 4500;
    this.timer = window.setTimeout(this.playBirdChirp, nextInterval);
  };

  public toggle() {
    this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.playing) {
      this.playing = true;
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(0.035, this.ctx.currentTime, 0.6);
      }
      this.playBirdChirp();
    } else {
      this.playing = false;
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      }
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
    this.notify();
  }
}

export const natureAudio = new NatureAudioService();
