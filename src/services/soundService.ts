// Minimal high-end sound service for tactical feedback
class SoundService {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.15;

  private init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  private playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 1) {
    this.init();
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

    gain.gain.setValueAtTime(this.masterVolume * volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.05, 0.5);
  }

  playSubmit() {
    this.playTone(400, 'sine', 0.2, 0.8);
    setTimeout(() => this.playTone(600, 'sine', 0.3, 0.6), 100);
  }

  playToggle(isOn: boolean) {
    if (isOn) {
      this.playTone(1000, 'sine', 0.1, 0.4);
      setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.3), 50);
    } else {
      this.playTone(1200, 'sine', 0.1, 0.4);
      setTimeout(() => this.playTone(1000, 'sine', 0.1, 0.3), 50);
    }
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }
}

export const soundService = new SoundService();
