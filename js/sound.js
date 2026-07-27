/**
 * Web Audio API Sound Synthesizer for Solo Leveling System SFX
 */
class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound(enable) {
    this.enabled = enable;
  }

  // Play Level Up Fanfare Sound
  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = this.audioCtx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Play Quest Complete Chime
  playQuestComplete() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    
    osc1.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.50, this.audioCtx.currentTime + 0.15); // C6

    osc2.frequency.setValueAtTime(659.25, this.audioCtx.currentTime); // E5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, this.audioCtx.currentTime + 0.15); // E6

    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.audioCtx.currentTime + 0.4);
    osc2.stop(this.audioCtx.currentTime + 0.4);
  }

  // Play Stat Allocation Click Sound
  playStatClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.06);
  }

  // Play Shop Purchase Gold Sound
  playPurchase() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const freqs = [987.77, 1318.51]; // B5, E6
    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = this.audioCtx.currentTime + idx * 0.07;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }
}

export const sound = new SoundEngine();
