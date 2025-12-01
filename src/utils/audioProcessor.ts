// Audio processing utilities for feature extraction
export class AudioProcessor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  // Extract MFCC features from audio buffer
  async extractMFCC(audioBuffer: AudioBuffer): Promise<number[][]> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Frame the signal
    const frameLength = Math.floor(0.025 * sampleRate); // 25ms frames
    const hopLength = Math.floor(0.01 * sampleRate); // 10ms hop
    const numFrames = Math.floor((channelData.length - frameLength) / hopLength) + 1;
    
    const mfccFeatures: number[][] = [];
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * hopLength;
      const frame = channelData.slice(start, start + frameLength);
      
      // Apply window function (Hamming window)
      const windowedFrame = this.applyHammingWindow(frame);
      
      // Compute FFT
      const fft = this.computeFFT(windowedFrame);
      
      // Apply mel filter bank
      const melSpectrum = this.applyMelFilterBank(fft, sampleRate);
      
      // Compute DCT to get MFCC
      const mfcc = this.computeDCT(melSpectrum);
      
      mfccFeatures.push(mfcc.slice(0, 13)); // Take first 13 coefficients
    }
    
    return mfccFeatures;
  }

  // Extract spectral features
  extractSpectralFeatures(audioBuffer: AudioBuffer): number[] {
    const channelData = audioBuffer.getChannelData(0);
    const fft = this.computeFFT(channelData);
    const magnitude = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag));
    
    // Spectral centroid
    const spectralCentroid = this.computeSpectralCentroid(magnitude);
    
    // Spectral rolloff
    const spectralRolloff = this.computeSpectralRolloff(magnitude);
    
    // Zero crossing rate
    const zcr = this.computeZeroCrossingRate(channelData);
    
    // RMS energy
    const rmsEnergy = this.computeRMSEnergy(channelData);
    
    return [spectralCentroid, spectralRolloff, zcr, rmsEnergy];
  }

  // Extract prosodic features (pitch, rhythm)
  extractProsodicFeatures(audioBuffer: AudioBuffer): number[] {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Fundamental frequency (F0) estimation using autocorrelation
    const f0 = this.estimateF0(channelData, sampleRate);
    
    // Pitch variation
    const pitchVariation = this.computePitchVariation(channelData, sampleRate);
    
    // Speaking rate (approximate)
    const speakingRate = this.estimateSpeakingRate(channelData, sampleRate);
    
    return [f0, pitchVariation, speakingRate];
  }

  private applyHammingWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length);
    for (let i = 0; i < frame.length; i++) {
      windowed[i] = frame[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (frame.length - 1)));
    }
    return windowed;
  }

  private computeFFT(signal: Float32Array): { real: number; imag: number }[] {
    // Simplified FFT implementation (in production, use a proper FFT library)
    const N = signal.length;
    const result: { real: number; imag: number }[] = [];
    
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      
      result.push({ real, imag });
    }
    
    return result;
  }

  private applyMelFilterBank(fft: { real: number; imag: number }[], sampleRate: number): number[] {
    const numFilters = 26;
    const melFilters: number[] = [];
    
    // Convert to mel scale and apply triangular filters
    for (let i = 0; i < numFilters; i++) {
      let sum = 0;
      const startFreq = this.melToHz(this.hzToMel(0) + i * (this.hzToMel(sampleRate / 2) - this.hzToMel(0)) / (numFilters + 1));
      const centerFreq = this.melToHz(this.hzToMel(0) + (i + 1) * (this.hzToMel(sampleRate / 2) - this.hzToMel(0)) / (numFilters + 1));
      const endFreq = this.melToHz(this.hzToMel(0) + (i + 2) * (this.hzToMel(sampleRate / 2) - this.hzToMel(0)) / (numFilters + 1));
      
      for (let j = 0; j < fft.length / 2; j++) {
        const freq = j * sampleRate / fft.length;
        let weight = 0;
        
        if (freq >= startFreq && freq <= centerFreq) {
          weight = (freq - startFreq) / (centerFreq - startFreq);
        } else if (freq > centerFreq && freq <= endFreq) {
          weight = (endFreq - freq) / (endFreq - centerFreq);
        }
        
        const magnitude = Math.sqrt(fft[j].real * fft[j].real + fft[j].imag * fft[j].imag);
        sum += weight * magnitude;
      }
      
      melFilters.push(Math.log(sum + 1e-10)); // Add small epsilon to avoid log(0)
    }
    
    return melFilters;
  }

  private computeDCT(melSpectrum: number[]): number[] {
    const N = melSpectrum.length;
    const dct: number[] = [];
    
    for (let k = 0; k < N; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += melSpectrum[n] * Math.cos(Math.PI * k * (n + 0.5) / N);
      }
      dct.push(sum);
    }
    
    return dct;
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  private computeSpectralCentroid(magnitude: number[]): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < magnitude.length; i++) {
      weightedSum += i * magnitude[i];
      magnitudeSum += magnitude[i];
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private computeSpectralRolloff(magnitude: number[]): number {
    const totalEnergy = magnitude.reduce((sum, mag) => sum + mag, 0);
    const threshold = 0.85 * totalEnergy;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < magnitude.length; i++) {
      cumulativeEnergy += magnitude[i];
      if (cumulativeEnergy >= threshold) {
        return i;
      }
    }
    
    return magnitude.length - 1;
  }

  private computeZeroCrossingRate(signal: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if ((signal[i] >= 0) !== (signal[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / signal.length;
  }

  private computeRMSEnergy(signal: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < signal.length; i++) {
      sum += signal[i] * signal[i];
    }
    return Math.sqrt(sum / signal.length);
  }

  private estimateF0(signal: Float32Array, sampleRate: number): number {
    // Autocorrelation-based F0 estimation
    const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
    const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
    
    let maxCorrelation = 0;
    let bestPeriod = minPeriod;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < signal.length - period; i++) {
        correlation += signal[i] * signal[i + period];
        count++;
      }
      
      correlation /= count;
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return sampleRate / bestPeriod;
  }

  private computePitchVariation(signal: Float32Array, sampleRate: number): number {
    const frameSize = Math.floor(0.025 * sampleRate);
    const hopSize = Math.floor(0.01 * sampleRate);
    const pitches: number[] = [];
    
    for (let i = 0; i < signal.length - frameSize; i += hopSize) {
      const frame = signal.slice(i, i + frameSize);
      const pitch = this.estimateF0(frame, sampleRate);
      if (pitch > 50 && pitch < 500) { // Valid pitch range
        pitches.push(pitch);
      }
    }
    
    if (pitches.length < 2) return 0;
    
    const mean = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
    const variance = pitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pitches.length;
    
    return Math.sqrt(variance);
  }

  private estimateSpeakingRate(signal: Float32Array, sampleRate: number): number {
    // Estimate speaking rate based on energy peaks
    const frameSize = Math.floor(0.01 * sampleRate); // 10ms frames
    const energies: number[] = [];
    
    for (let i = 0; i < signal.length - frameSize; i += frameSize) {
      const frame = signal.slice(i, i + frameSize);
      const energy = this.computeRMSEnergy(frame);
      energies.push(energy);
    }
    
    // Count energy peaks (syllables approximation)
    const threshold = energies.reduce((sum, e) => sum + e, 0) / energies.length * 0.3;
    let peaks = 0;
    
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        peaks++;
      }
    }
    
    const durationSeconds = signal.length / sampleRate;
    return peaks / durationSeconds; // Syllables per second
  }
}