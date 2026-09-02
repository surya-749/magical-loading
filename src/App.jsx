import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpiderVerseLoader from './components/SpiderVerseLoader/SpiderVerseLoader';
import WarpText from './components/WarpText';
import './App.css';

function App() {
  // Flow: 'WELCOME' (2s silent) -> 'VIDEO' (video + song) -> 'PLAYING' (game) -> 'DONE'
  const [gameState, setGameState] = useState('WELCOME');
  const [isGlitching, setIsGlitching] = useState(false);

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
      promise.catch(() => {
        // Autoplay policy fallback: unlock on first click or keypress
        const unlock = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          window.removeEventListener('click', unlock);
          window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
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

  // ── Phase 2: Video + Song start together ─────────────────────────────────
  useEffect(() => {
    if (gameState !== 'VIDEO') return;

    // Start soundtrack right when video phase begins
    playAudio();

    const vid = videoRef.current;
    if (!vid) return;

    vid.currentTime = 0;
    vid.muted = true; // Keep video track muted so the mp3 soundtrack plays cleanly
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        console.log('Video autoplay prevented:', e);
      });
    }

    const handleEnded = () => {
      fadeOutAudio(800);
      setGameState('PLAYING');
    };

    const handleError = () => {
      console.warn('Video failed to load or play, jumping to game');
      fadeOutAudio(800);
      setGameState('PLAYING');
    };

    vid.addEventListener('ended', handleEnded);
    vid.addEventListener('error', handleError);
    return () => {
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

      {/* Cinematic Intro Layer: Black background with WarpText */}
      <div 
        className="intro-layer" 
        style={{ 
          opacity: (gameState === 'INTRO' && !videoPlaying) ? 1 : 0,
          pointerEvents: (gameState === 'INTRO' && !videoPlaying) ? 'auto' : 'none'
        }}
      >
         {(gameState === 'INTRO' && !videoPlaying) && (
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
         )}
      </div>

      {/* Menu Overlay */}
      {gameState === 'MENU' && (
        <div className="overlay-center menu-ui futuristic-panel">
          <h1>READY TO SWING?</h1>
          <div className="instructions-card">
             <h3>MISSION BRIEFING</h3>
             <ul>
               <li><span className="key-hint">LEFT CLICK</span> to shoot a web and start swinging</li>
               <li><span className="key-hint">TARGETS</span> Webs can <strong>ONLY</strong> be attached to buildings!</li>
               <li><span className="key-hint">RELEASE</span> mouse button to detach and freefall</li>
               <li><span className="key-hint">MISSION TIME</span> Play for the duration of website sync/loading!</li>
               <li><span className="key-hint">AVOID</span> red security drones & stay out of the abyss</li>
             </ul>
          </div>
          <button className="play-button" onClick={handlePlayClick}>
            ENTER SPIDER-VERSE
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
