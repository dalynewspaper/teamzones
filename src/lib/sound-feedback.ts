class SoundFeedback {
  private audioContext: AudioContext | null = null;

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  async playTone(frequency: number, duration: number) {
    this.initAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.1; // Low volume

    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
  }

  startRecording() {
    this.playTone(880, 100); // High beep
  }

  stopRecording() {
    this.playTone(440, 100); // Lower beep
  }

  error() {
    this.playTone(220, 200); // Long low beep
  }
}

export const soundFeedback = new SoundFeedback(); 