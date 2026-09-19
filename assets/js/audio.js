/**
 * ESCAPE — Original Lo-Fi Ambient Audio Engine
 * 
 * Generates an original, warm, slow late-night lo-fi loop using the Web Audio API:
 * - Soft Rhodes / electric piano-like neo-soul chords with gentle tape wow/flutter
 * - Mellow, low-tempo filtered beat (soft kick, muted rim/brush, quiet shaker)
 * - Faint vinyl surface crackle & cozy room resonance
 * - 100% code-synthesized: zero external audio files or dependencies
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.compressor = null;
    this.tapeFilter = null;
    this.vinylNode = null;
    this.timerId = null;

    // Lo-Fi Tempo & Timing
    this.bpm = 62; // Slow, contemplative tempo
    this.secondsPerBeat = 60 / this.bpm; // ~0.9677s
    this.secondsPerBar = this.secondsPerBeat * 4; // ~3.87s
    this.currentBar = 0;
    this.nextBarTime = 0;
    this.scheduleAhead = 0.3; // Lookahead window (seconds)

    // Original Lo-Fi Chord Progression (Ebmaj9 -> Cm9 -> Fm9 -> Bb13sus)
    // Dreamy, nostalgic, relaxing, non-copyrighted
    this.progression = [
      {
        name: 'Ebmaj9',
        root: 155.56, // Eb3
        notes: [155.56, 196.00, 233.08, 293.66, 349.23], // Eb3, G3, Bb3, D4, F4
        lead: [349.23, 293.66]
      },
      {
        name: 'Cm9',
        root: 130.81, // C3
        notes: [130.81, 196.00, 233.08, 311.13, 392.00], // C3, G3, Bb3, Eb4, G4
        lead: [392.00, 311.13]
      },
      {
        name: 'Fm9',
        root: 87.31, // F2
        notes: [87.31, 130.81, 174.61, 207.65, 261.63, 311.13], // F2, C3, F3, Ab3, C4, Eb4
        lead: [261.63, 207.65]
      },
      {
        name: 'Bb13sus',
        root: 116.54, // Bb2
        notes: [116.54, 174.61, 207.65, 261.63, 293.66, 392.00], // Bb2, F3, Ab3, C4, D4, G4
        lead: [293.66, 261.63]
      }
    ];
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Master Output Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    // 2. Warm Tape Master Filter (cuts harsh digital highs)
    this.tapeFilter = this.ctx.createBiquadFilter();
    this.tapeFilter.type = 'lowpass';
    this.tapeFilter.frequency.setValueAtTime(4200, this.ctx.currentTime);
    this.tapeFilter.Q.setValueAtTime(0.6, this.ctx.currentTime);

    // 3. Gentle Analog Bus Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-22, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.2, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.03, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.28, this.ctx.currentTime);

    // Routing
    this.masterGain.connect(this.tapeFilter);
    this.tapeFilter.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  // Generate faint vinyl surface dust and subtle crackle
  createVinylNoiseNode() {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filtered pink hiss
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.03;
      b2 = 0.85 * b2 + white * 0.01;
      let sample = (b0 + b1 + b2) * 0.035;

      // Occasional gentle vinyl micro-pop / dust click
      if (Math.random() < 0.0007) {
        sample += (Math.random() * 2 - 1) * 0.22;
      }
      data[i] = sample;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const vinylFilter = this.ctx.createBiquadFilter();
    vinylFilter.type = 'bandpass';
    vinylFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    vinylFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const vinylGain = this.ctx.createGain();
    vinylGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    source.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(this.masterGain);

    source.start(0);
    return { source, gain: vinylGain };
  }

  // Play a soft, bell-like Rhodes electric piano note
  playRhodesNote(freq, time, duration = 3.2, velocity = 0.18) {
    if (!this.ctx || freq <= 0) return;

    // Carrier (fundamental warmth)
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, time);

    // Tine harmonic (Rhodes bell overtones)
    const tine = this.ctx.createOscillator();
    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 2.01, time); // Slight harmonic detune

    // Subtle Wow & Flutter LFO (analog tape drift)
    const driftLfo = this.ctx.createOscillator();
    const driftGain = this.ctx.createGain();
    driftLfo.frequency.setValueAtTime(0.35 + Math.random() * 0.1, time);
    driftGain.gain.setValueAtTime(3.5, time); // ~3-4 cents pitch drift
    driftLfo.connect(driftGain);
    driftGain.connect(carrier.detune);
    driftGain.connect(tine.detune);
    driftLfo.start(time);
    driftLfo.stop(time + duration);

    // Rhodes Tremolo LFO (vintage suitcase effect)
    const tremoloLfo = this.ctx.createOscillator();
    const tremoloGain = this.ctx.createGain();
    tremoloLfo.frequency.setValueAtTime(2.2, time);
    tremoloGain.gain.setValueAtTime(0.12, time);
    tremoloLfo.connect(tremoloGain);

    // Note amplitude envelope
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity, time + 0.035); // Smooth attack
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.45, time + 1.2); // Decay
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration); // Long gentle fade

    // Warm note filter
    const voiceFilter = this.ctx.createBiquadFilter();
    voiceFilter.type = 'lowpass';
    voiceFilter.frequency.setValueAtTime(Math.min(freq * 3.8, 1400), time);
    voiceFilter.Q.setValueAtTime(0.65, time);

    // Connect nodes
    carrier.connect(voiceGain);
    tine.connect(voiceGain);
    voiceGain.connect(voiceFilter);
    voiceFilter.connect(this.masterGain);

    carrier.start(time);
    tine.start(time);
    carrier.stop(time + duration);
    tine.stop(time + duration);
  }

  // Play a soft, rounded lo-fi kick (warm low-end pulse)
  playMuffledKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Pitch sweep downwards
    osc.frequency.setValueAtTime(78, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    // Amplitude envelope
    gain.gain.setValueAtTime(0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(125, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  // Play a soft brush / muted rimshot on beat 3
  playMutedRim(time) {
    // 1. Noise body (brush/paper texture)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1150, time);
    noiseFilter.Q.setValueAtTime(1.8, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // 2. Subtle wooden tap resonance
    const tap = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    tap.type = 'triangle';
    tap.frequency.setValueAtTime(210, time);
    tapGain.gain.setValueAtTime(0.07, time);
    tapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    tap.connect(tapGain);
    tapGain.connect(this.masterGain);

    noiseSource.start(time);
    noiseSource.stop(time + 0.12);
    tap.start(time);
    tap.stop(time + 0.07);
  }

  // Play a very quiet, gentle shaker / hi-hat
  playSoftShaker(time, velocity = 0.028) {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.038);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + 0.04);
  }

  // Schedule one complete 4-beat bar of music
  scheduleBar(startTime, barIndex) {
    const chordIdx = barIndex % this.progression.length;
    const chord = this.progression[chordIdx];

    // 1. Rhodes Chord: subtle humanized strum (staggered note onsets)
    const notes = chord.notes;
    notes.forEach((freq, idx) => {
      const strumOffset = idx * 0.045 + (Math.random() * 0.01);
      const vel = 0.14 + (idx === 0 ? 0.04 : 0) + Math.random() * 0.02;
      this.playRhodesNote(freq, startTime + strumOffset, 3.4, vel);
    });

    // 2. Soft passing melodic note (adds intimate improvisation feel)
    if (chord.lead && chord.lead.length > 0) {
      const leadNote = chord.lead[barIndex % chord.lead.length];
      const leadTime = startTime + this.secondsPerBeat * 2.5 + (Math.random() * 0.05);
      this.playRhodesNote(leadNote, leadTime, 2.2, 0.09);
    }

    // 3. Subtle Low-Tempo Lo-Fi Beat
    // Beat 1: Warm Muffled Kick
    this.playMuffledKick(startTime);

    // Ghost Kick on Beat 3.75 in alternating bars
    if (barIndex % 2 === 1) {
      this.playMuffledKick(startTime + this.secondsPerBeat * 2.75);
    }

    // Beat 3: Muted Rim / Brush Snare
    this.playMutedRim(startTime + this.secondsPerBeat * 2);

    // Relaxed 8th-note Shaker with human swing
    for (let step = 0; step < 8; step++) {
      const isUpbeat = step % 2 === 1;
      const swing = isUpbeat ? 0.032 : 0;
      const stepTime = startTime + (step * (this.secondsPerBeat * 0.5)) + swing;
      const vel = isUpbeat ? 0.022 : 0.035;
      this.playSoftShaker(stepTime, vel);
    }
  }

  // Lookahead scheduler loop
  scheduler() {
    if (!this.isPlaying) return;

    while (this.nextBarTime < this.ctx.currentTime + this.scheduleAhead) {
      this.scheduleBar(this.nextBarTime, this.currentBar);
      this.nextBarTime += this.secondsPerBar;
      this.currentBar++;
    }
  }

  start() {
    this.init();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Start subtle vinyl surface texture
    if (!this.vinylNode) {
      this.vinylNode = this.createVinylNoiseNode();
    }

    // Initialize scheduler timing
    this.nextBarTime = this.ctx.currentTime + 0.15;
    this.currentBar = 0;
    this.isPlaying = true;

    // Run scheduler every 40ms
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.scheduler(), 40);

    // Smooth, gentle fade-in over 2.2 seconds (default low, intimate volume)
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.28, now + 2.2);
  }

  stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Smooth, gentle fade-out over 1.4 seconds
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    setTimeout(() => {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      if (this.vinylNode) {
        try {
          this.vinylNode.source.stop();
          this.vinylNode.source.disconnect();
        } catch (e) {}
        this.vinylNode = null;
      }
      this.isPlaying = false;
    }, 1450);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

window.AmbientAudioEngine = AmbientAudioEngine;
