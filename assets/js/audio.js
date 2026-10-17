/**
 * ESCAPE — Ambient Solace Multi-Scene Audio Engine
 * 
 * Aesthetic: Warm, comforting, gentle hope, poetic, peaceful.
 * Distinct musical pieces per world:
 * 1. 'intro': D Major felt piano (Dmaj9 -> Gmaj7(add9) -> Bm9 -> Asus4), 74 BPM
 * 2. 'rainy': F Major intimate felt piano (Fmaj7 -> C/E -> Dm9 -> Bbmaj7), 68 BPM + raindrop pings
 * 3. 'sea': E Major fingerstyle acoustic guitar (Eadd9 -> Badd11 -> C#m7 -> Aadd9), 76 BPM
 * 4. 'quiet': G Major wooden mallet / kalimba, 72 BPM, gentle and hopeful
 * 5. 'city': user-supplied local Holy Night MP3
 * 6. 'impossible': A Lydian celestial bells / music box starlight drift, 66 BPM
 * 
 * Features:
 * - 2.4s smooth Web Audio crossfading between worlds without sound spikes or voice overlap
 * - Zero autoplay before user engagement
 * - Independent Music and Rain volume sliders with localStorage persistence & true silence at 0
 * - Procedural Web Audio plus a local MP3 for City; no external services
 */

class EscapeAudioEngine {
  constructor() {
    this.ctx = null;
    this.cityRecording = null;
    this.cityPlayPending = false;
    document.addEventListener('visibilitychange', () => this.syncCityRecording());
    this.isPlaying = false;
    this.targetState = 'stopped'; // 'playing' | 'stopped'
    this.stopTimeout = null;

    // Active track ID
    this.activeTrackId = 'intro';

    // Room context (Somewhere Rainy)
    this.inRainyRoom = false;

    // Volume states (memorized in localStorage)
    this.musicVolume = this.getStoredVolume('escape_music_volume', 0.65);
    this.rainVolume = this.getStoredVolume('escape_rain_volume', 0.60);

    // Audio Graph Nodes
    this.masterGain = null;
    this.musicGain = null;
    this.rainGain = null;
    this.rainRoomGain = null;
    this.acousticFilter = null;
    this.masterCompressor = null;
    this.rainSourceNode = null;
    this.hammerBuffer = null;
    this.trackGains = {};
    this.retiredTracks = new Set();

    this.scheduleAhead = 0.40;
    this.timerId = null;

    // Definition of all 6 distinct scene compositions
    this.trackDefs = {
      // 1. Intro & Selection: D Major felt piano (Approved)
      intro: {
        bpm: 74,
        secondsPerBeat: 60 / 74,
        secondsPerBar: (60 / 74) * 4,
        nextBarTime: 0,
        currentBar: 0,
        progression: [
          {
            name: 'Dmaj9',
            root: 146.83, // D3
            fifth: 220.00, // A3
            chord: [369.99, 440.00, 554.37], // F#4, A4, C#5
            leadNotes: [
              { timeOffset: 1.5, freq: 440.00, vel: 0.12, dur: 2.8 },
              { timeOffset: 2.2, freq: 554.37, vel: 0.14, dur: 3.0 },
              { timeOffset: 3.0, freq: 493.88, vel: 0.11, dur: 2.4 }
            ]
          },
          {
            name: 'Gmaj7(add9)',
            root: 98.00, // G2
            fifth: 146.83, // D3
            chord: [246.94, 369.99, 440.00], // B3, F#4, A4
            leadNotes: [
              { timeOffset: 1.5, freq: 369.99, vel: 0.12, dur: 2.8 },
              { timeOffset: 2.2, freq: 440.00, vel: 0.13, dur: 3.0 },
              { timeOffset: 3.0, freq: 369.99, vel: 0.10, dur: 2.4 }
            ]
          },
          {
            name: 'Bm9',
            root: 123.47, // B2
            fifth: 185.00, // F#3
            chord: [293.66, 369.99, 440.00], // D4, F#4, A4
            leadNotes: [
              { timeOffset: 1.5, freq: 440.00, vel: 0.13, dur: 2.8 },
              { timeOffset: 2.2, freq: 554.37, vel: 0.14, dur: 3.0 },
              { timeOffset: 3.0, freq: 587.33, vel: 0.11, dur: 2.4 }
            ]
          },
          {
            name: 'Asus4(add9)',
            root: 110.00, // A2
            fifth: 164.81, // E3
            chord: [246.94, 277.18, 329.63], // B3, C#4, E4
            leadNotes: [
              { timeOffset: 1.5, freq: 369.99, vel: 0.13, dur: 2.8 },
              { timeOffset: 2.2, freq: 329.63, vel: 0.12, dur: 3.2 },
              { timeOffset: 3.0, freq: 277.18, vel: 0.10, dur: 2.6 }
            ]
          }
        ]
      },

      // 2. Somewhere Rainy: F Major warm felt piano (Gentle, comforting, reassuring)
      rainy: {
        bpm: 68,
        secondsPerBeat: 60 / 68,
        secondsPerBar: (60 / 68) * 4,
        nextBarTime: 0,
        currentBar: 0,
        progression: [
          {
            name: 'Fmaj7',
            root: 87.31, // F2
            fifth: 130.81, // C3
            chord: [220.00, 261.63, 329.63], // A3, C4, E4
            leadNotes: [
              { timeOffset: 1.6, freq: 329.63, vel: 0.13, dur: 3.2 }, // E4
              { timeOffset: 2.3, freq: 349.23, vel: 0.14, dur: 3.0 }, // F4
              { timeOffset: 3.1, freq: 261.63, vel: 0.11, dur: 2.6 }  // C4
            ]
          },
          {
            name: 'C/E',
            root: 82.41, // E2
            fifth: 123.47, // B2
            chord: [196.00, 261.63, 392.00], // G3, C4, G4
            leadNotes: [
              { timeOffset: 1.5, freq: 392.00, vel: 0.13, dur: 3.0 }, // G4
              { timeOffset: 2.3, freq: 329.63, vel: 0.12, dur: 3.2 }, // E4
              { timeOffset: 3.1, freq: 293.66, vel: 0.10, dur: 2.6 }  // D4
            ]
          },
          {
            name: 'Dm9',
            root: 73.42, // D2
            fifth: 110.00, // A2
            chord: [174.61, 261.63, 329.63], // F3, C4, E4
            leadNotes: [
              { timeOffset: 1.5, freq: 261.63, vel: 0.12, dur: 3.0 }, // C4
              { timeOffset: 2.2, freq: 329.63, vel: 0.14, dur: 3.2 }, // E4
              { timeOffset: 3.0, freq: 293.66, vel: 0.11, dur: 2.8 }  // D4
            ]
          },
          {
            name: 'Bbmaj7(add9)',
            root: 116.54, // Bb2
            fifth: 174.61, // F3
            chord: [293.66, 440.00, 523.25], // D4, A4, C5
            leadNotes: [
              { timeOffset: 1.4, freq: 440.00, vel: 0.13, dur: 3.0 }, // A4
              { timeOffset: 2.1, freq: 392.00, vel: 0.11, dur: 2.8 }, // G4
              { timeOffset: 2.8, freq: 349.23, vel: 0.12, dur: 2.8 }, // F4
              { timeOffset: 3.3, freq: 261.63, vel: 0.09, dur: 2.4 }  // C4
            ]
          }
        ]
      },

      // 3. Somewhere by the Sea: E Major fingerstyle acoustic guitar (Plucked, airy, peaceful)
      sea: {
        bpm: 76,
        secondsPerBeat: 60 / 76,
        secondsPerBar: (60 / 76) * 4,
        nextBarTime: 0,
        currentBar: 0,
        progression: [
          {
            name: 'Eadd9',
            root: 82.41, // E2
            fifth: 123.47, // B2
            arpeggios: [
              { timeOffset: 0.0, freq: 82.41, vel: 0.15, dur: 2.8 },  // E2 (thumb bass)
              { timeOffset: 0.5, freq: 207.65, vel: 0.11, dur: 2.2 }, // G#3
              { timeOffset: 1.0, freq: 369.99, vel: 0.13, dur: 2.4 }, // F#4
              { timeOffset: 1.75, freq: 493.88, vel: 0.12, dur: 2.2 },// B4
              { timeOffset: 2.5, freq: 659.25, vel: 0.14, dur: 2.5 }, // E5
              { timeOffset: 3.25, freq: 369.99, vel: 0.10, dur: 2.0 } // F#4
            ]
          },
          {
            name: 'Badd11',
            root: 61.74, // B1
            fifth: 92.50, // F#2
            arpeggios: [
              { timeOffset: 0.0, freq: 123.47, vel: 0.14, dur: 2.8 }, // B2
              { timeOffset: 0.5, freq: 155.56, vel: 0.11, dur: 2.2 }, // D#3
              { timeOffset: 1.0, freq: 246.94, vel: 0.12, dur: 2.4 }, // B3
              { timeOffset: 1.75, freq: 329.63, vel: 0.13, dur: 2.2 },// E4
              { timeOffset: 2.5, freq: 369.99, vel: 0.13, dur: 2.5 }, // F#4
              { timeOffset: 3.25, freq: 246.94, vel: 0.10, dur: 2.0 } // B3
            ]
          },
          {
            name: 'C#m7',
            root: 69.30, // C#2
            fifth: 103.83, // G#2
            arpeggios: [
              { timeOffset: 0.0, freq: 138.59, vel: 0.14, dur: 2.8 }, // C#3
              { timeOffset: 0.5, freq: 164.81, vel: 0.11, dur: 2.2 }, // E3
              { timeOffset: 1.0, freq: 246.94, vel: 0.12, dur: 2.4 }, // B3
              { timeOffset: 1.75, freq: 277.18, vel: 0.13, dur: 2.2 },// C#4
              { timeOffset: 2.5, freq: 415.30, vel: 0.14, dur: 2.5 }, // G#4
              { timeOffset: 3.25, freq: 246.94, vel: 0.10, dur: 2.0 } // B3
            ]
          },
          {
            name: 'Aadd9',
            root: 55.00, // A1
            fifth: 82.41, // E2
            arpeggios: [
              { timeOffset: 0.0, freq: 110.00, vel: 0.14, dur: 2.8 }, // A2
              { timeOffset: 0.5, freq: 138.59, vel: 0.11, dur: 2.2 }, // C#3
              { timeOffset: 1.0, freq: 207.65, vel: 0.12, dur: 2.4 }, // G#3
              { timeOffset: 1.75, freq: 246.94, vel: 0.13, dur: 2.2 },// B3
              { timeOffset: 2.5, freq: 329.63, vel: 0.14, dur: 2.6 }, // E4
              { timeOffset: 3.25, freq: 207.65, vel: 0.10, dur: 2.0 } // G#3
            ]
          }
        ]
      },

      // 4. Somewhere Quiet: warm major-key wooden notes, a light 72 BPM garden melody.
      quiet: {
        "bpm": 72,
        "secondsPerBeat": 0.8333333333333334,
        "secondsPerBar": 3.3333333333333335,
        "nextBarTime": 0,
        "currentBar": 0,
        "progression": [
          {
            "name": "G6",
            "root": 196,
            "notes": [
              {
                "timeOffset": 0,
                "freq": 196,
                "vel": 0.11,
                "dur": 2.4
              },
              {
                "timeOffset": 0.75,
                "freq": 293.66,
                "vel": 0.095,
                "dur": 1.85
              },
              {
                "timeOffset": 1.5,
                "freq": 392,
                "vel": 0.1,
                "dur": 1.85
              },
              {
                "timeOffset": 2.25,
                "freq": 440,
                "vel": 0.085,
                "dur": 1.85
              },
              {
                "timeOffset": 3.25,
                "freq": 392,
                "vel": 0.09,
                "dur": 1.85
              }
            ]
          },
          {
            "name": "Cmaj7",
            "root": 130.81,
            "notes": [
              {
                "timeOffset": 0,
                "freq": 261.63,
                "vel": 0.11,
                "dur": 2.4
              },
              {
                "timeOffset": 0.75,
                "freq": 329.63,
                "vel": 0.095,
                "dur": 1.85
              },
              {
                "timeOffset": 1.5,
                "freq": 392,
                "vel": 0.1,
                "dur": 1.85
              },
              {
                "timeOffset": 2.25,
                "freq": 493.88,
                "vel": 0.085,
                "dur": 1.85
              },
              {
                "timeOffset": 3.25,
                "freq": 392,
                "vel": 0.09,
                "dur": 1.85
              }
            ]
          },
          {
            "name": "Dadd9",
            "root": 146.83,
            "notes": [
              {
                "timeOffset": 0,
                "freq": 293.66,
                "vel": 0.11,
                "dur": 2.4
              },
              {
                "timeOffset": 0.75,
                "freq": 369.99,
                "vel": 0.095,
                "dur": 1.85
              },
              {
                "timeOffset": 1.5,
                "freq": 440,
                "vel": 0.1,
                "dur": 1.85
              },
              {
                "timeOffset": 2.25,
                "freq": 329.63,
                "vel": 0.085,
                "dur": 1.85
              },
              {
                "timeOffset": 3.25,
                "freq": 369.99,
                "vel": 0.09,
                "dur": 1.85
              }
            ]
          },
          {
            "name": "Gadd9",
            "root": 196,
            "notes": [
              {
                "timeOffset": 0,
                "freq": 196,
                "vel": 0.11,
                "dur": 2.4
              },
              {
                "timeOffset": 0.75,
                "freq": 293.66,
                "vel": 0.095,
                "dur": 1.85
              },
              {
                "timeOffset": 1.5,
                "freq": 440,
                "vel": 0.1,
                "dur": 1.85
              },
              {
                "timeOffset": 2.25,
                "freq": 392,
                "vel": 0.085,
                "dur": 1.85
              },
              {
                "timeOffset": 3.25,
                "freq": 293.66,
                "vel": 0.09,
                "dur": 1.85
              }
            ]
          }
        ]
      },

      // 5. Somewhere in the City: Db / Ab Major warm Rhodes electric piano + mellow chillhop pulse
      city: {
  "bpm": 68,
  "secondsPerBeat": 0.8823529411764706,
  "secondsPerBar": 3.5294117647058822,
  "nextBarTime": 0,
  "currentBar": 0,
  "progression": [
    {
      "root": 130.815,
      "notes": [
        {
          "freq": 261.63,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 293.66,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 440,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 659.26
    },
    {
      "root": 196,
      "notes": [
        {
          "freq": 392,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 293.66,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 261.63,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 587.32
    },
    {
      "root": 130.815,
      "notes": [
        {
          "freq": 329.63,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 392,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 440,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 880
    },
    {
      "root": 196,
      "notes": [
        {
          "freq": 293.66,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 261.63,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 293.66,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 392,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 587.32
    },
    {
      "root": 130.815,
      "notes": [
        {
          "freq": 440,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 392,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 293.66,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 659.26
    },
    {
      "root": 196,
      "notes": [
        {
          "freq": 261.63,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 392,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 440,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 784
    },
    {
      "root": 130.815,
      "notes": [
        {
          "freq": 392,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 293.66,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 261.63,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 659.26
    },
    {
      "root": 196,
      "notes": [
        {
          "freq": 293.66,
          "timeOffset": 0,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 329.63,
          "timeOffset": 0.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 293.66,
          "timeOffset": 1.75,
          "dur": 2.4,
          "vel": 0.095
        },
        {
          "freq": 261.63,
          "timeOffset": 2.75,
          "dur": 2.4,
          "vel": 0.095
        }
      ],
      "flute": 587.32
    }
  ]
},

      // 6. Somewhere Impossible: A Lydian ethereal celestial bells / music box (Mystical, comforting)
      impossible: {
        bpm: 66,
        secondsPerBeat: 60 / 66,
        secondsPerBar: (60 / 66) * 4,
        nextBarTime: 0,
        currentBar: 0,
        progression: [
          {
            name: 'Amaj9(#11)',
            root: 110.00, // A2
            fifth: 164.81, // E3
            pad: [277.18, 415.30, 622.25], // C#4, G#4, D#5 (Lydian #11)
            bells: [
              { timeOffset: 1.5, freq: 659.25, vel: 0.12, dur: 3.8 }, // E5
              { timeOffset: 2.4, freq: 622.25, vel: 0.13, dur: 3.6 }, // D#5
              { timeOffset: 3.2, freq: 493.88, vel: 0.10, dur: 3.2 }  // B4
            ]
          },
          {
            name: 'Badd9/A',
            root: 110.00, // A2 pedal
            fifth: 185.00, // F#3
            pad: [311.13, 369.99, 493.88], // D#4, F#4, B4
            bells: [
              { timeOffset: 1.5, freq: 739.99, vel: 0.12, dur: 3.8 }, // F#5
              { timeOffset: 2.3, freq: 622.25, vel: 0.13, dur: 3.6 }, // D#5
              { timeOffset: 3.2, freq: 415.30, vel: 0.10, dur: 3.2 }  // G#4
            ]
          },
          {
            name: 'C#m9',
            root: 69.30, // C#2
            fifth: 103.83, // G#2
            pad: [164.81, 246.94, 311.13], // E3, B3, D#4
            bells: [
              { timeOffset: 1.5, freq: 830.61, vel: 0.13, dur: 3.8 }, // G#5
              { timeOffset: 2.4, freq: 659.25, vel: 0.12, dur: 3.6 }, // E5
              { timeOffset: 3.2, freq: 622.25, vel: 0.10, dur: 3.2 }  // D#5
            ]
          },
          {
            name: 'F#m9',
            root: 92.50, // F#2
            fifth: 138.59, // C#3
            pad: [220.00, 329.63, 415.30], // A3, E4, G#4
            bells: [
              { timeOffset: 1.5, freq: 659.25, vel: 0.12, dur: 3.8 }, // E5
              { timeOffset: 2.3, freq: 554.37, vel: 0.12, dur: 3.6 }, // C#5
              { timeOffset: 3.2, freq: 493.88, vel: 0.10, dur: 3.2 }  // B4
            ]
          }
        ]
      }
    };
  }

  getStoredVolume(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch (e) {}
    return fallback;
  }

  saveStoredVolume(key, val) {
    try {
      localStorage.setItem(key, Math.max(0, Math.min(1, val)).toFixed(2));
    } catch (e) {}
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Master Output Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    // 2. Music Channel Gain (Controls overall music level)
    this.musicGain = this.ctx.createGain();
    const musicLevel = this.musicVolume <= 0.001 ? 0.0 : this.musicVolume;
    this.musicGain.gain.setValueAtTime(musicLevel, this.ctx.currentTime);

    // 3. Rain Channel Gain & Room Presence Multiplier
    this.rainGain = this.ctx.createGain();
    const rainLevel = this.rainVolume <= 0.001 ? 0.0 : this.rainVolume;
    this.rainGain.gain.setValueAtTime(rainLevel, this.ctx.currentTime);

    this.rainRoomGain = this.ctx.createGain();
    // Only audible inside Somewhere Rainy
    this.rainRoomGain.gain.setValueAtTime(this.inRainyRoom ? 1.0 : 0, this.ctx.currentTime);

    // 4. Warm Acoustic Master Filter (soft lowpass cutting digital glare above 2800Hz)
    this.acousticFilter = this.ctx.createBiquadFilter();
    this.acousticFilter.type = 'lowpass';
    this.acousticFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
    this.acousticFilter.Q.setValueAtTime(0.55, this.ctx.currentTime);

    // 5. Gentle Master Bus Compressor (smooths dynamic peaks, gives intimate warmth)
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(2.4, this.ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.04, this.ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.35, this.ctx.currentTime);

    // 6. Multi-Track Individual Gain Nodes (Connected into musicGain for seamless 2.4s crossfade)
    this.trackGains = {};
    Object.keys(this.trackDefs).forEach((id) => {
      const gainNode = this.ctx.createGain();
      const initialGain = id === this.activeTrackId ? 1.0 : 0.0001;
      gainNode.gain.setValueAtTime(initialGain, this.ctx.currentTime);
      gainNode.connect(this.musicGain);
      this.trackGains[id] = gainNode;
    });

    // Routing Graph:
    // trackGains[*] -> musicGain -> masterGain
    this.musicGain.connect(this.masterGain);

    // rainGain -> rainRoomGain -> masterGain
    this.rainGain.connect(this.rainRoomGain);
    this.rainRoomGain.connect(this.masterGain);

    // masterGain -> acousticFilter -> masterCompressor -> destination
    this.masterGain.connect(this.acousticFilter);
    this.acousticFilter.connect(this.masterCompressor);
    this.masterCompressor.connect(this.ctx.destination);

    // Pre-generate soft felt hammer noise impulse
    this.initHammerBuffer();
  }

  // Pre-generate soft felt hammer impulse buffer (eliminates harsh digital key clicks)
  initHammerBuffer() {
    if (!this.ctx || this.hammerBuffer) return;
    const len = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
    }
    this.hammerBuffer = buf;
  }

  /**
   * Instrument Synthesizers
   */

  // 1. Warm Felt Piano Note (Used for 'intro' and 'rainy')
  playWarmPianoNote(trackId, freq, time, duration = 3.4, velocity = 0.16, filterCutoff = 2000, bodyHz = 380) {
    const trackGainNode = this.trackGains[trackId];
    if (!this.ctx || !trackGainNode || freq <= 0 || this.musicVolume <= 0.001) return;

    // Body: Fundamental Sine + Warm Triangle
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time);

    osc1.detune.setValueAtTime(-1.8, time);
    osc2.detune.setValueAtTime(1.8, time);

    // Felt hammer transient impact
    let hammerSource = null;
    let hammerGain = null;
    if (this.hammerBuffer) {
      hammerSource = this.ctx.createBufferSource();
      hammerSource.buffer = this.hammerBuffer;
      const hammerFilter = this.ctx.createBiquadFilter();
      hammerFilter.type = 'lowpass';
      hammerFilter.frequency.setValueAtTime(450, time);
      hammerGain = this.ctx.createGain();
      hammerGain.gain.setValueAtTime(velocity * 0.14, time);
      hammerGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.038);
      hammerSource.connect(hammerFilter);
      hammerFilter.connect(hammerGain);
    }

    // Amplitude envelope
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + 0.032);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.38, time + 1.1);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Warm acoustic low-pass filter
    const noteFilter = this.ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    const cutoff = Math.min(freq * 2.8, filterCutoff);
    noteFilter.frequency.setValueAtTime(cutoff, time);
    noteFilter.Q.setValueAtTime(0.6, time);

    // Soundboard body resonance
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(bodyHz, time);
    bodyFilter.gain.setValueAtTime(2.0, time);
    bodyFilter.Q.setValueAtTime(0.75, time);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(noteFilter);
    if (hammerGain) hammerGain.connect(noteFilter);

    noteFilter.connect(bodyFilter);
    bodyFilter.connect(trackGainNode);

    osc1.start(time);
    osc2.start(time);
    if (hammerSource) hammerSource.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + duration);
    if (hammerSource) hammerSource.stop(time + 0.04);
  }

  // 2. Plucked Acoustic Guitar Note (Used for 'sea')
  playGuitarPluckNote(trackId, freq, time, duration = 2.4, velocity = 0.14) {
    const trackGainNode = this.trackGains[trackId];
    if (!this.ctx || !trackGainNode || freq <= 0 || this.musicVolume <= 0.001) return;

    // Pluck body: Triangle + subtle pulse/saw bite
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, time);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.18, time);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15); // Fast bite decay

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    // Fast plucked attack
    noteGain.gain.linearRampToValueAtTime(velocity, time + 0.006);
    // Fingerstyle pluck decay
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.42, time + 0.18);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Acoustic guitar body filter
    const guitarFilter = this.ctx.createBiquadFilter();
    guitarFilter.type = 'lowpass';
    guitarFilter.frequency.setValueAtTime(2400, time);
    guitarFilter.Q.setValueAtTime(0.7, time);

    const guitarBody = this.ctx.createBiquadFilter();
    guitarBody.type = 'peaking';
    guitarBody.frequency.setValueAtTime(220, time); // Guitar soundbox resonance
    guitarBody.gain.setValueAtTime(2.5, time);

    osc1.connect(noteGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    noteGain.connect(guitarFilter);
    guitarFilter.connect(guitarBody);
    guitarBody.connect(trackGainNode);

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + 0.18);
  }

  // 3. Organic Wooden Mallet / Kalimba Note (Used for 'quiet')
  playWoodenNote(trackId, freq, time, duration = 3.2, velocity = 0.13) {
    const trackGainNode = this.trackGains[trackId];
    if (!this.ctx || !trackGainNode || freq <= 0 || this.musicVolume <= 0.001) return;

    // Pure sine fundamental + subtle woody 3rd harmonic
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    const overtone = this.ctx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 3, time);

    const overGain = this.ctx.createGain();
    overGain.gain.setValueAtTime(velocity * 0.18, time);
    overGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    // Soft wooden mallet attack (18ms)
    noteGain.gain.linearRampToValueAtTime(velocity, time + 0.018);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Warm bamboo/wood resonator
    const woodFilter = this.ctx.createBiquadFilter();
    woodFilter.type = 'peaking';
    woodFilter.frequency.setValueAtTime(460, time);
    woodFilter.gain.setValueAtTime(3.0, time);

    osc.connect(noteGain);
    overtone.connect(overGain);
    overGain.connect(noteGain);

    noteGain.connect(woodFilter);
    woodFilter.connect(trackGainNode);

    osc.start(time);
    overtone.start(time);

    osc.stop(time + duration);
    overtone.stop(time + 0.05);
  }

  // 4. Mellow Rhodes Electric Piano Note (Used for 'city')
  playCityFlute(freq, time, duration) {
    const output = this.trackGains.city;
    if (!this.ctx || !output || this.musicVolume <= .001) return;
    const voice = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    voice.type = 'sine';
    voice.frequency.setValueAtTime(freq * .995, time);
    voice.frequency.linearRampToValueAtTime(freq, time + .14);
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.linearRampToValueAtTime(.055, time + .18);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    voice.connect(gain); gain.connect(output);
    voice.onended = () => { voice.disconnect(); gain.disconnect(); };
    voice.start(time); voice.stop(time + duration);
  }

  playRhodesNote(trackId, freq, time, duration = 2.6, velocity = 0.13) {
    const trackGainNode = this.trackGains[trackId];
    if (!this.ctx || !trackGainNode || freq <= 0 || this.musicVolume <= 0.001) return;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time); // 2nd harmonic tine bite

    const tineGain = this.ctx.createGain();
    tineGain.gain.setValueAtTime(velocity * 0.22, time);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + 0.016);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.45, time + 0.4);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Soft Rhodes low-pass
    const rhodesFilter = this.ctx.createBiquadFilter();
    rhodesFilter.type = 'lowpass';
    rhodesFilter.frequency.setValueAtTime(1750, time);

    osc1.connect(noteGain);
    osc2.connect(tineGain);
    tineGain.connect(noteGain);

    noteGain.connect(rhodesFilter);
    rhodesFilter.connect(trackGainNode);

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + 0.1);
  }

  // 4b. Soft Chillhop Groove (Sub kick + gentle rim click for 'city')
  playChillhopBeat(trackId, time, type = 'kick') {
    const trackGainNode = this.trackGains[trackId];
    if (!this.ctx || !trackGainNode || this.musicVolume <= 0.001) return;

    if (type === 'kick') {
      // Very soft low-pass heartbeat kick
      const osc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      const kickFilter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(68, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.11);

      kickFilter.type = 'lowpass';
      kickFilter.frequency.setValueAtTime(115, time);

      kickGain.gain.setValueAtTime(0.09, time);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);

      osc.connect(kickFilter);
      kickFilter.connect(kickGain);
      kickGain.connect(trackGainNode);

      osc.start(time);
      osc.stop(time + 0.14);
    } else if (type === 'rim') {
      // Soft organic rim/wood tap
      const len = Math.floor(this.ctx.sampleRate * 0.025);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.2));
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const rimFilter = this.ctx.createBiquadFilter();
      rimFilter.type = 'bandpass';
      rimFilter.frequency.setValueAtTime(950, time);
      rimFilter.Q.setValueAtTime(1.8, time);

      const rimGain = this.ctx.createGain();
      rimGain.gain.setValueAtTime(0.045, time);
      rimGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.024);

      src.connect(rimFilter);
      rimFilter.connect(rimGain);
      rimGain.connect(trackGainNode);

      src.start(time);
      src.stop(time + 0.025);
    }
  }

  // 5. Celestial Bells / Music Box Chime Note (Used for 'impossible')
  playCelestialBellNote(trackId, freq, time, duration = 3.8, velocity = 0.12) {
    const trackGainNode = this.trackGains[trackId];
    if (!this.ctx || !trackGainNode || freq <= 0 || this.musicVolume <= 0.001) return;

    // Pure fundamental + crystalline inharmonic partials
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, time); // Bell chime partial

    const partialGain = this.ctx.createGain();
    partialGain.gain.setValueAtTime(velocity * 0.18, time);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.85);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Warm high-shelf bell air
    const bellFilter = this.ctx.createBiquadFilter();
    bellFilter.type = 'lowpass';
    bellFilter.frequency.setValueAtTime(3200, time);

    osc1.connect(noteGain);
    osc2.connect(partialGain);
    partialGain.connect(noteGain);

    noteGain.connect(bellFilter);
    bellFilter.connect(trackGainNode);

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + 0.9);
  }

  // Continuous soft rain noise generator (Somewhere Rainy)
  createRainNoiseNode() {
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Balanced pink noise algorithm (1/f soft wash)
    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      b0L = 0.99886 * b0L + whiteL * 0.0555;
      b1L = 0.99332 * b1L + whiteL * 0.0750;
      b2L = 0.96900 * b2L + whiteL * 0.1538;
      b3L = 0.86650 * b3L + whiteL * 0.3104;
      b4L = 0.55000 * b4L + whiteL * 0.5329;
      left[i] = (b0L + b1L + b2L + b3L + b4L) * 0.038;

      const whiteR = Math.random() * 2 - 1;
      b0R = 0.99886 * b0R + whiteR * 0.0555;
      b1R = 0.99332 * b1R + whiteR * 0.0750;
      b2R = 0.96900 * b2R + whiteR * 0.1538;
      b3R = 0.86650 * b3R + whiteR * 0.3104;
      b4R = 0.55000 * b4R + whiteR * 0.5329;
      right[i] = (b0R + b1R + b2R + b3R + b4R) * 0.038;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const rainBandpass = this.ctx.createBiquadFilter();
    rainBandpass.type = 'bandpass';
    rainBandpass.frequency.setValueAtTime(1150, this.ctx.currentTime);
    rainBandpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const rainSmooth = this.ctx.createBiquadFilter();
    rainSmooth.type = 'lowpass';
    rainSmooth.frequency.setValueAtTime(2400, this.ctx.currentTime);

    source.connect(rainBandpass);
    rainBandpass.connect(rainSmooth);
    rainSmooth.connect(this.rainGain);

    source.start(0);
    return source;
  }

  // Soft window glass raindrop ping (Somewhere Rainy)
  playSoftWindowDrop(time) {
    if (!this.ctx || !this.inRainyRoom || this.rainVolume <= 0.001) return;
    const osc = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    const dropFilter = this.ctx.createBiquadFilter();

    const freq = 1200 + Math.random() * 600;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, time + 0.03);

    dropFilter.type = 'lowpass';
    dropFilter.frequency.setValueAtTime(1600, time);

    dropGain.gain.setValueAtTime(0.016 + Math.random() * 0.012, time);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.038);

    osc.connect(dropFilter);
    dropFilter.connect(dropGain);
    dropGain.connect(this.rainGain);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  /**
   * Bar Scheduler by Scene Track
   */
  scheduleTrackBar(trackId, def, startTime, barIndex) {
    let chord = def.progression[barIndex % def.progression.length];
    if (trackId !== 'intro') {
      const phrase = Math.floor(barIndex / def.progression.length) % 4;
      chord = { ...chord };
      for (const key of ['leadNotes', 'arpeggios', 'notes', 'bells']) {
        if (!chord[key]) continue;
        let notes = chord[key].map(note => ({ ...note }));
        if (phrase === 1) notes = notes.filter((_, i) => i % 3 !== 2);
        if (phrase === 2) {
          const pitches = notes.map(note => note.freq).reverse();
          notes = notes.map((note, i) => ({ ...note, freq: pitches[i], vel: note.vel * 0.9 }));
        }
        if (phrase === 3) notes = notes.filter((_, i) => i % 2 === 0).map(note => ({ ...note, vel: note.vel * 0.85 }));
        chord[key] = notes;
      }
    }

    switch (trackId) {
      case 'intro': {
        // D Major felt piano
        this.playWarmPianoNote(trackId, chord.root, startTime, 3.4, 0.17, 2000, 380);
        if (chord.fifth) {
          this.playWarmPianoNote(trackId, chord.fifth, startTime + 0.045, 3.2, 0.13, 1900, 380);
        }
        if (chord.chord && chord.chord[0]) {
          this.playWarmPianoNote(trackId, chord.chord[0], startTime + def.secondsPerBeat * 1.5, 2.8, 0.11, 1800, 380);
        }
        if (chord.leadNotes) {
          chord.leadNotes.forEach((lead) => {
            this.playWarmPianoNote(trackId, lead.freq, startTime + lead.timeOffset * def.secondsPerBeat, lead.dur, lead.vel, 2100, 380);
          });
        }
        break;
      }

      case 'rainy': {
        // F Major intimate felt piano
        this.playWarmPianoNote(trackId, chord.root, startTime, 3.8, 0.17, 1600, 310);
        if (chord.fifth) {
          this.playWarmPianoNote(trackId, chord.fifth, startTime + 0.05, 3.4, 0.13, 1500, 310);
        }
        if (chord.chord && chord.chord[0]) {
          this.playWarmPianoNote(trackId, chord.chord[0], startTime + def.secondsPerBeat * 1.5, 3.0, 0.11, 1500, 310);
        }
        if (chord.leadNotes) {
          chord.leadNotes.forEach((lead) => {
            this.playWarmPianoNote(trackId, lead.freq, startTime + lead.timeOffset * def.secondsPerBeat, lead.dur, lead.vel, 1750, 310);
          });
        }
        // Raindrop window sprinkles
        if (this.inRainyRoom && this.rainVolume > 0.001) {
          this.playSoftWindowDrop(startTime + def.secondsPerBeat * 1.2);
          if (Math.random() > 0.4) {
            this.playSoftWindowDrop(startTime + def.secondsPerBeat * 2.8);
          }
        }
        break;
      }

      case 'sea': {
        // E Major fingerstyle acoustic guitar arpeggios
        if (chord.arpeggios) {
          chord.arpeggios.forEach((note) => {
            this.playGuitarPluckNote(trackId, note.freq, startTime + note.timeOffset * def.secondsPerBeat, note.dur, note.vel);
          });
        }
        break;
      }

      case 'quiet': {
        // G Pentatonic sparse wooden mallet / kalimba
        if (chord.notes) {
          chord.notes.forEach((note) => {
            this.playWoodenNote(trackId, note.freq, startTime + note.timeOffset * def.secondsPerBeat, note.dur, note.vel);
          });
        }
        break;
      }

      case 'city': {
        // Original pentatonic instrumental: plucked strings and a soft flute-like voice.
        this.playGuitarPluckNote(trackId, chord.root, startTime, 3, .065);
        chord.notes.forEach(note => this.playGuitarPluckNote(trackId, note.freq, startTime + note.timeOffset * def.secondsPerBeat, note.dur, note.vel));
        this.playCityFlute(chord.flute, startTime + def.secondsPerBeat, 2.1);
        break;
      }

      case 'impossible': {
        // A Lydian celestial bells and drifting stardust
        this.playCelestialBellNote(trackId, chord.root, startTime, 4.2, 0.16);
        if (chord.fifth) {
          this.playCelestialBellNote(trackId, chord.fifth, startTime + 0.06, 3.8, 0.12);
        }
        if (chord.pad) {
          chord.pad.forEach((freq, idx) => {
            this.playCelestialBellNote(trackId, freq, startTime + def.secondsPerBeat * 0.8 + 0.04 * idx, 3.5, 0.08);
          });
        }
        if (chord.bells) {
          chord.bells.forEach((bell) => {
            this.playCelestialBellNote(trackId, bell.freq, startTime + bell.timeOffset * def.secondsPerBeat, bell.dur, bell.vel);
          });
        }
        break;
      }
    }
  }

  // Lookahead scheduler loop (ticking all active/audible tracks)
  scheduler() {
    if (!this.isPlaying || !this.ctx) return;

    Object.entries(this.trackDefs).forEach(([id, def]) => {
      const gainNode = this.trackGains[id];
      if (!gainNode) return;

      // Only schedule if track is currently active or audible during crossfade
      if (id !== this.activeTrackId || id === 'city') return;
      // Resume after background throttling without scheduling a backlog.
      if (def.nextBarTime < this.ctx.currentTime - 0.1) def.nextBarTime = this.ctx.currentTime + 0.04;

      while (def.nextBarTime < this.ctx.currentTime + this.scheduleAhead) {
        this.scheduleTrackBar(id, def, def.nextBarTime, def.currentBar);
        def.nextBarTime += def.secondsPerBar;
        def.currentBar++;
      }
    });
  }

  /**
   * Scene Track Transition with 2.4s Crossfade
   */
  ramp(param, target, seconds) {
    const now = this.ctx.currentTime;
    const current = param.value;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else { param.cancelScheduledValues(now); param.setValueAtTime(current, now); }
    param.linearRampToValueAtTime(target, now + seconds);
  }

  // The supplied MP3 is played only in City, after the shared sound toggle is enabled.
  syncCityRecording() {
    const wanted = () => this.isPlaying && this.activeTrackId === 'city' && !document.hidden && this.musicVolume > .001;
    if (!wanted()) { this.cityRecording?.pause(); return; }
    if (!this.cityRecording) {
      this.cityRecording = new Audio('assets/audio/saigon-holy-night.mp3');
      this.cityRecording.loop = true;
      this.cityRecording.preload = 'none';
      this.cityRecording.addEventListener('error', () => {
        const label = document.getElementById('city-music-status');
        if (label) label.textContent = 'Chưa tải được nhạc. Kiểm tra thư mục assets/audio rồi thử bật lại âm thanh.';
      });
    }
    this.cityRecording.volume = this.musicVolume;
    if (this.cityPlayPending || !this.cityRecording.paused) return;
    this.cityPlayPending = true;
    Promise.resolve(this.cityRecording.play()).then(() => {
      if (!wanted()) this.cityRecording.pause();
      const label = document.getElementById('city-music-status');
      if (label) label.textContent = 'Holy Night · bản nhạc bạn chọn';
    }).catch(() => {
      const label = document.getElementById('city-music-status');
      if (label) label.textContent = 'Nhấn tắt rồi bật âm thanh để thử phát nhạc lại.';
    }).finally(() => { this.cityPlayPending = false; });
  }

  setTrack(newTrackId) {
    if (!this.trackDefs[newTrackId] || newTrackId === this.activeTrackId) return;
    const previous = this.activeTrackId;
    this.activeTrackId = newTrackId;
    this.syncCityRecording();
    if (!this.ctx) return;
    const old = this.trackGains[previous];
    if (old) {
      this.ramp(old.gain, 0, 2.4);
      this.retiredTracks.add(old);
      setTimeout(() => { old.disconnect(); this.retiredTracks.delete(old); }, 2500);
    }
    // Discard the unused bus from initialization; never revive old voices.
    this.trackGains[newTrackId]?.disconnect();
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0, this.ctx.currentTime);
    bus.connect(this.musicGain);
    this.trackGains[newTrackId] = bus;
    this.ramp(bus.gain, 1, 2.4);
    this.trackDefs[newTrackId].nextBarTime = this.ctx.currentTime + 0.08;
  }

  /**
   * Room Context Coordinator
   * Tiếng mưa chỉ phát trong Somewhere Rainy và fade out khi rời phòng.
   */
  setRoom(isRainy) {
    this.inRainyRoom = isRainy;
    if (!this.ctx || !this.rainRoomGain) return;
    this.ramp(this.rainRoomGain.gain, isRainy ? 1 : 0, isRainy ? 1.6 : 1.2);
  }

  /**
   * Volume Controls (with true silence at 0 and persistence)
   */
  setMusicVolume(pct) {
    const val = Math.max(0, Math.min(1, pct));
    this.musicVolume = val;
    this.syncCityRecording();
    this.saveStoredVolume('escape_music_volume', val);

    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      if (val <= 0.001) {
        this.musicGain.gain.setValueAtTime(0.0, now);
      } else {
        const cur = Math.max(this.musicGain.gain.value, 0.0001);
        this.musicGain.gain.setValueAtTime(cur, now);
        this.musicGain.gain.exponentialRampToValueAtTime(val, now + 0.08);
      }
    }
  }

  setRainVolume(pct) {
    const val = Math.max(0, Math.min(1, pct));
    this.rainVolume = val;
    this.saveStoredVolume('escape_rain_volume', val);

    if (this.rainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.rainGain.gain.cancelScheduledValues(now);
      if (val <= 0.001) {
        this.rainGain.gain.setValueAtTime(0.0, now);
      } else {
        const cur = Math.max(this.rainGain.gain.value, 0.0001);
        this.rainGain.gain.setValueAtTime(cur, now);
        this.rainGain.gain.exponentialRampToValueAtTime(val, now + 0.08);
      }
    }
  }

  /**
   * Master Playback Lifecycle
   */
  start() {
    if (this.isPlaying) return true;
    const continuing = Boolean(this.timerId);
    this.targetState = 'playing';
    this.isPlaying = true;
    this.syncCityRecording();

    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    this.init();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Start continuous rain noise generator if not running
    if (!this.rainSourceNode) {
      this.rainSourceNode = this.createRainNoiseNode();
    }

    const now = this.ctx.currentTime;

    this.setRoom(this.inRainyRoom);
    if (!continuing) {
      Object.keys(this.trackGains).forEach((id) => {
        this.trackGains[id].disconnect();
        const bus = this.ctx.createGain();
        bus.gain.setValueAtTime(id === this.activeTrackId ? 1 : 0, now);
        bus.connect(this.musicGain);
        this.trackGains[id] = bus;
        this.trackDefs[id].nextBarTime = now + 0.12;
      });
    }

    // Start scheduler interval if not active
    if (!this.timerId) {
      this.timerId = setInterval(() => this.scheduler(), 40);
    }

    this.ramp(this.masterGain.gain, 1, 1.6);

    return true;
  }

  stop() {
    this.targetState = 'stopped';
    this.isPlaying = false;
    this.syncCityRecording();

    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    if (!this.ctx || !this.masterGain) return false;

    this.ramp(this.masterGain.gain, 0, 0.75);

    this.stopTimeout = setTimeout(() => {
      if (this.targetState === 'stopped') {
        if (this.timerId) {
          clearInterval(this.timerId);
          this.timerId = null;
        }
        if (this.rainSourceNode) {
          try {
            this.rainSourceNode.stop();
            this.rainSourceNode.disconnect();
          } catch (e) {}
          this.rainSourceNode = null;
        }
      }
      this.stopTimeout = null;
    }, 800);

    return false;
  }

  toggle() {
    if (this.targetState === 'playing') {
      return this.stop();
    } else {
      return this.start();
    }
  }
}

// Global Aliases
window.AmbientAudioEngine = EscapeAudioEngine;
window.EscapeAudioEngine = EscapeAudioEngine;
