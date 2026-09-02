import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpiderVerseLoader from './components/SpiderVerseLoader/SpiderVerseLoader';
import WarpText from './components/WarpText';
import './App.css';

function App() {
  // Flow: 'WELCOME' (2s silent) -> 'VIDEO' (video + song) -> 'PLAYING' (game) -> 'DONE'
  const [gameState, setGameState] = useState('WELCOME');
  const [isGlitching, setIsGlitching] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // ── Audio helper: play and soft fade out ──────────────────────────────────
  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 1;
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          setAudioBlocked(false);
        })
        .catch(() => {
          // Autoplay policy: Browser requires user interaction to enable sound
          setAudioBlocked(true);

          const unlock = () => {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            setAudioBlocked(false);
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
          };

          window.addEventListener('click', unlock);
          window.addEventListener('keydown', unlock);
          window.addEventListener('touchstart', unlock);
        });
    }
  }, []);

  const fadeOutAudio = useCallback((duration = 1000) => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    const steps = 20;
    const stepMs = duration / steps;
    const volStep = audio.volume / steps;
    let i = 0;
    const t = setInterval(() => {
      i++;
      audio.volume = Math.max(0, audio.volume - volStep);
      if (i >= steps) {
        clearInterval(t);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
      }
    }, stepMs);
  }, []);

  // ── Phase 1: WELCOME for exactly 2 seconds, then transition to VIDEO ──────
  useEffect(() => {
    if (gameState !== 'WELCOME') return;

    const timer = setTimeout(() => {
      setGameState('VIDEO');
    }, 2000); // 2 seconds on Welcome (silent)

    return () => clearTimeout(timer);
  }, [gameState]);

  // ── Phase 2: Video starts and audio triggers when video begins rendering ─
  useEffect(() => {
    if (gameState !== 'VIDEO') return;

    const vid = videoRef.current;
    if (!vid) return;

    vid.currentTime = 0;
    vid.muted = true; // Keep video track muted so the mp3 soundtrack plays cleanly

    // Only start audio once the video actually begins rendering and playing
    const handleVideoPlaying = () => {
      playAudio();
    };

    const handleEnded = () => {
      fadeOutAudio(800);
      setGameState('PLAYING');
    };

    const handleError = () => {
      console.warn('Video failed to load or play, jumping to game');
      fadeOutAudio(800);
      setGameState('PLAYING');
    };

    vid.addEventListener('playing', handleVideoPlaying);
    vid.addEventListener('ended', handleEnded);
    vid.addEventListener('error', handleError);

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        console.log('Video autoplay prevented:', e);
      });
    }

    return () => {
      vid.removeEventListener('playing', handleVideoPlaying);
      vid.removeEventListener('ended', handleEnded);
      vid.removeEventListener('error', handleError);
    };
  }, [gameState, playAudio, fadeOutAudio]);

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 400);
  }, []);

  const handleLoaderComplete = useCallback(() => {
    triggerGlitch();
    setTimeout(() => setGameState('DONE'), 300);
  }, [triggerGlitch]);

  return (
    <div className={`app-container ${isGlitching ? 'severe-glitch' : ''}`}>

      {/* ── Audio soundtrack element ── */}
      <audio
        ref={audioRef}
        src="/cropped-miles.mp4.mp3"
        loop={false}
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* ── Subtle prompt if browser blocked autoplay before user click ── */}
      {audioBlocked && (gameState === 'VIDEO' || gameState === 'WELCOME') && (
        <div className="audio-unlock-toast" onClick={playAudio}>
          🎵 Tap anywhere to enable sound
        </div>
      )}

      {/* ── Phase 1: Cinematic WarpText "WELCOME" for 2 seconds ── */}
      {gameState === 'WELCOME' && (
        <div className="intro-layer">
          <WarpText
            text="WELCOME"
            color="#ff0044"
            warpStrength={0.1}
            warpScale={2.0}
            speed={0.6}
            fontSize="clamp(4rem, 15vw, 12rem)"
            fontWeight={800}
            style={{ width: '100%', height: '400px' }}
          />
        </div>
      )}

      {/* ── Phase 2: Video background layer (Active during VIDEO phase) ── */}
      {gameState === 'VIDEO' && (
        <video
          ref={videoRef}
          src="/cropped-miles.mp4"
          className="video-bg"
          autoPlay
          muted
          playsInline
        />
      )}

      {/* ── Phase 3: Spider-Verse interactive game ── */}
      {gameState === 'PLAYING' && (
        <SpiderVerseLoader onComplete={handleLoaderComplete} />
      )}

      {/* ── Phase 4: Post-game done screen ── */}
      {gameState === 'DONE' && (
        <div className="overlay-center futuristic-panel done-screen">
          <h1 className="glitch-text" data-text="WELCOME TO THE SPIDER-VERSE">
            WELCOME TO THE SPIDER-VERSE
          </h1>
          <p style={{ color: '#aaa', fontFamily: 'var(--body-font)', marginTop: '1rem' }}>
            Your website is now fully loaded.
          </p>
          <button
            className="play-button"
            style={{ marginTop: '2rem', fontSize: '1.8rem' }}
            onClick={() => setGameState('PLAYING')}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
