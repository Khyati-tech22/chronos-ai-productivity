/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundService {
  private context: AudioContext | null = null;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, this.context.currentTime);

    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }

  // Subtle click for generic buttons
  playClick() {
    this.playTone(800, 'sine', 0.1, 0.1);
  }

  // Soft pop for submitting/distilling
  playSubmit() {
    this.playTone(400, 'sine', 0.2, 0.15);
    setTimeout(() => this.playTone(600, 'sine', 0.1, 0.1), 50);
  }

  // Unique shift for focus mode
  playToggle(isEntering: boolean) {
    if (isEntering) {
      this.playTone(200, 'sine', 0.3, 0.1);
      setTimeout(() => this.playTone(300, 'sine', 0.2, 0.05), 100);
    } else {
      this.playTone(300, 'sine', 0.3, 0.1);
      setTimeout(() => this.playTone(200, 'sine', 0.2, 0.05), 100);
    }
  }
}

export const soundService = new SoundService();
