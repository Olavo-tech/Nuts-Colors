/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private currentNotes: AudioNode[] = [];
  private sfxVolumeNode: GainNode | null = null;
  private musicVolumeNode: GainNode | null = null;
  private masterVolumeNode: GainNode | null = null;
  
  private musicVolume: number = 0.4;
  private sfxVolume: number = 0.6;
  private isMusicPlaying: boolean = false;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterVolumeNode = this.ctx.createGain();
      this.masterVolumeNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterVolumeNode.connect(this.ctx.destination);

      this.sfxVolumeNode = this.ctx.createGain();
      this.sfxVolumeNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxVolumeNode.connect(this.masterVolumeNode);

      this.musicVolumeNode = this.ctx.createGain();
      this.musicVolumeNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicVolumeNode.connect(this.masterVolumeNode);
    } catch (e) {
      console.warn("Web Audio API not supported in this browser.", e);
    }
  }

  private resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSfxVolume(vol: number) {
    this.sfxVolume = vol;
    if (this.sfxVolumeNode && this.ctx) {
      this.sfxVolumeNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(vol: number) {
    this.musicVolume = vol;
    if (this.musicVolumeNode && this.ctx) {
      this.musicVolumeNode.gain.setTargetAtTime(vol * 0.5, this.ctx.currentTime, 0.05); // slightly quieter music
    }
  }

  // SFX: Click
  playClick() {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // SFX: Move Nut (lift or drop)
  playMove(isLift: boolean = true) {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (isLift) {
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.12);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    } else {
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    }

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // SFX: Invalid Move (Buzz)
  playError() {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  // SFX: Perfect Bolt Completed (satisfying ding-ding!)
  playSuccess() {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const playTone = (freq: number, startDelay: number, duration: number) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + startDelay);

      gain.gain.setValueAtTime(0, t + startDelay);
      gain.gain.linearRampToValueAtTime(0.18, t + startDelay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + startDelay + duration);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(t + startDelay);
      osc.stop(t + startDelay + duration + 0.05);
    };

    // Nice rapid major third arpeggio
    playTone(523.25, 0, 0.3); // C5
    playTone(659.25, 0.08, 0.35); // E5
    playTone(783.99, 0.16, 0.45); // G5
  }

  // SFX: Level Solved (Fanfare!)
  playWin() {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const playTone = (freq: number, type: 'sine' | 'triangle', startDelay: number, duration: number, vol: number) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t + startDelay);

      gain.gain.setValueAtTime(0, t + startDelay);
      gain.gain.linearRampToValueAtTime(vol, t + startDelay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + startDelay + duration);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(t + startDelay);
      osc.stop(t + startDelay + duration + 0.05);
    };

    // Soaring fanfare: C4, E4, G4, C5, E5, G5... C6!
    playTone(261.63, 'triangle', 0.0, 0.25, 0.15); // C4
    playTone(329.63, 'triangle', 0.1, 0.25, 0.15); // E4
    playTone(392.00, 'triangle', 0.2, 0.25, 0.15); // G4
    playTone(523.25, 'triangle', 0.3, 0.3, 0.15);  // C5
    playTone(659.25, 'sine', 0.4, 0.4, 0.12);  // E5
    playTone(783.99, 'sine', 0.5, 0.5, 0.12);  // G5
    playTone(1046.50, 'sine', 0.6, 1.2, 0.18); // C6 (sustained climax)
    
    // Harmony notes on the final climax
    playTone(1318.51, 'sine', 0.7, 1.1, 0.1); // E6
    playTone(1567.98, 'sine', 0.8, 1.0, 0.08); // G6
  }

  // SFX: Star Unlocked
  playStar(index: number) {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Higher pitches for successive stars
    const pitches = [587.33, 698.46, 880.00]; // D5, F5, A5
    const pitch = pitches[index] || 880;

    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.4);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  // SFX: Level Up
  playLevelUp() {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const playTone = (freq: number, startDelay: number, duration: number) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + startDelay);
      osc.frequency.linearRampToValueAtTime(freq * 1.1, t + startDelay + duration);

      gain.gain.setValueAtTime(0, t + startDelay);
      gain.gain.linearRampToValueAtTime(0.2, t + startDelay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + startDelay + duration);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(t + startDelay);
      osc.stop(t + startDelay + duration + 0.1);
    };

    // Energetic rising sweep chords
    playTone(440.00, 0, 0.3); // A4
    playTone(554.37, 0.05, 0.35); // C#5
    playTone(659.25, 0.1, 0.4); // E5
    playTone(880.00, 0.15, 0.6); // A5
  }

  // SFX: Level Unlocked
  playLevelUnlocked() {
    this.resume();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.3);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Soft Ambient Background Music using additive synthesis
  startMusic() {
    if (this.isMusicPlaying) return;
    this.resume();
    this.isMusicPlaying = true;
    
    let step = 0;
    // Beautiful chill pentatonic scale in C Major (C, D, E, G, A)
    const notes = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // Pentatonic notes C3 to A4

    const playAmbientNote = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicVolumeNode) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      
      // Select a low root note and a slow arpeggiating higher note
      const baseNote = notes[step % 4]; // Root pad (C3, D3, E3, G3)
      const leadNote = notes[4 + Math.floor(Math.random() * 6)]; // Melody

      // Play soft base pad
      osc.frequency.setValueAtTime(baseNote, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 2.0); // slow attack
      gain.gain.exponentialRampToValueAtTime(0.001, t + 6.0); // slow decay

      osc.connect(gain);
      gain.connect(this.musicVolumeNode);
      osc.start(t);
      osc.stop(t + 6.5);

      // Play a very quiet, glistening melody bell
      if (Math.random() > 0.3) {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(leadNote, t + 1.0);
        
        gain2.gain.setValueAtTime(0, t + 1.0);
        gain2.gain.linearRampToValueAtTime(0.03, t + 1.5);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 4.5);

        osc2.connect(gain2);
        gain2.connect(this.musicVolumeNode);
        osc2.start(t + 1.0);
        osc2.stop(t + 5.0);
      }

      step++;
    };

    // Play right away and repeat every 4 seconds for overlapping ambient pads
    playAmbientNote();
    this.musicInterval = setInterval(playAmbientNote, 4000);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const audio = new AudioEngine();
export default audio;
