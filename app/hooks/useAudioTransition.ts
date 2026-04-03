'use client';
import { useRef, useCallback } from 'react';

// Audio transition configuration
const FADE_DURATION = 300; // ms for fade in/out
const FADE_STEPS = 15; // number of volume steps
const GAP_DURATION = 400; // ms pause between tracks

interface UseAudioTransitionOptions {
  onEnded?: () => void;
  onError?: () => void;
}

export function useAudioTransition(options: UseAudioTransitionOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  // Clear any ongoing fade
  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  // Fade out current audio
  const fadeOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioRef.current || audioRef.current.paused) {
        resolve();
        return;
      }

      const audio = audioRef.current;
      const startVolume = audio.volume;
      const stepSize = startVolume / FADE_STEPS;
      const stepDuration = FADE_DURATION / FADE_STEPS;
      let currentStep = 0;

      clearFade();

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - stepSize * currentStep);
        audio.volume = newVolume;

        if (currentStep >= FADE_STEPS) {
          clearFade();
          audio.pause();
          audio.volume = 1; // Reset volume for next use
          resolve();
        }
      }, stepDuration);
    });
  }, [clearFade]);

  // Fade in new audio
  const fadeIn = useCallback((audio: HTMLAudioElement): Promise<void> => {
    return new Promise((resolve) => {
      audio.volume = 0;

      const stepSize = 1 / FADE_STEPS;
      const stepDuration = FADE_DURATION / FADE_STEPS;
      let currentStep = 0;

      clearFade();

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.min(1, stepSize * currentStep);
        audio.volume = newVolume;

        if (currentStep >= FADE_STEPS) {
          clearFade();
          audio.volume = 1;
          resolve();
        }
      }, stepDuration);
    });
  }, [clearFade]);

  // Play new audio with crossfade transition
  const playAudio = useCallback(async (src: string): Promise<void> => {
    // Fade out current audio if playing
    if (audioRef.current && !audioRef.current.paused) {
      await fadeOut();
    }

    // Wait for gap duration
    await new Promise(resolve => setTimeout(resolve, GAP_DURATION));

    // Create and setup new audio
    const newAudio = new Audio(src);
    audioRef.current = newAudio;
    isPlayingRef.current = true;

    newAudio.addEventListener('ended', () => {
      isPlayingRef.current = false;
      options.onEnded?.();
    });

    newAudio.addEventListener('error', () => {
      isPlayingRef.current = false;
      options.onError?.();
    });

    // Start playing with fade in
    try {
      await newAudio.play();
      await fadeIn(newAudio);
    } catch (e) {
      console.error('Audio play error:', e);
      isPlayingRef.current = false;
      options.onError?.();
    }
  }, [fadeOut, fadeIn, options]);

  // Stop audio immediately (for cleanup)
  const stopAudio = useCallback(() => {
    clearFade();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, [clearFade]);

  // Stop audio with fade out
  const stopWithFade = useCallback(async () => {
    if (audioRef.current && !audioRef.current.paused) {
      await fadeOut();
    }
    audioRef.current = null;
    isPlayingRef.current = false;
  }, [fadeOut]);

  // Get current audio element (for time sync, etc.)
  const getAudio = useCallback(() => audioRef.current, []);

  // Check if currently playing
  const isPlaying = useCallback(() => isPlayingRef.current, []);

  return {
    playAudio,
    stopAudio,
    stopWithFade,
    getAudio,
    isPlaying,
  };
}

// Simpler version for components that manage their own audio element
export function fadeAudioOut(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    if (audio.paused) {
      resolve();
      return;
    }

    const startVolume = audio.volume;
    const stepSize = startVolume / FADE_STEPS;
    const stepDuration = FADE_DURATION / FADE_STEPS;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, startVolume - stepSize * currentStep);

      if (currentStep >= FADE_STEPS) {
        clearInterval(interval);
        audio.pause();
        audio.volume = 1;
        resolve();
      }
    }, stepDuration);
  });
}

export function fadeAudioIn(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    audio.volume = 0;

    const stepSize = 1 / FADE_STEPS;
    const stepDuration = FADE_DURATION / FADE_STEPS;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(1, stepSize * currentStep);

      if (currentStep >= FADE_STEPS) {
        clearInterval(interval);
        audio.volume = 1;
        resolve();
      }
    }, stepDuration);
  });
}

export const AUDIO_GAP = GAP_DURATION;
