/**
 * Netflix TV High-Fidelity Custom Video Playback Module (Visual Volume Fix)
 */
const TVVideoEngine = (() => {
  let isVideoActive = false;
  let activeHudBtnIndex = 1; // 0: Back5s, 1: Play/Pause, 2: Fwd5s, 3: Volume
  let hudFadeTimeout = null;
  
  // Audio level state tracking parameters (normalized range from 0.0 to 1.0)
  let currentVolumeLevel = 1.0; 

  const getElements = () => ({
    overlay: document.getElementById('videoPlayerOverlay'),
    video: document.getElementById('tvNativeVideo'),
    hud: document.getElementById('playerControlsHud'),
    progressBar: document.getElementById('playerProgressBar'),
    timeLabel: document.getElementById('playerTimeTracker'),
    stateLabel: document.getElementById('playerStateText'),
    playIcon: document.getElementById('playPauseIcon'),
    movieTitle: document.getElementById('playerMovieTitle'),
    volumeBar: document.getElementById('volumeIndicatorBar'),
    volumeText: document.getElementById('volumePercentageLabel'),
    btnLabel: document.getElementById('playBtnLabel'),
    volumeBtn: document.getElementById('hud-volume-control')
  });

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const syncHudButtons = () => {
    const el = getElements();
    const hudBtns = document.querySelectorAll('.hud-btn');
    
    hudBtns.forEach(btn => btn.classList.remove('active'));
    if (hudBtns[activeHudBtnIndex]) {
      hudBtns[activeHudBtnIndex].classList.add('active');
    }
    
    // Sync Play/Pause tracking icons and text elements
    if (el.video.paused) {
      el.playIcon.innerHTML = `<path d="M8 5v14l11-7z" fill="currentColor"/>`;
      el.stateLabel.textContent = "PAUSED";
      if (el.btnLabel) el.btnLabel.textContent = "Play";
    } else {
      el.playIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>`;
      el.stateLabel.textContent = "PLAYING";
      if (el.btnLabel) el.btnLabel.textContent = "Pause";
    }

    // Direct atomic rendering updates for audio sliders
    if (el.volumeBar && el.volumeText) {
      const displayPercentage = Math.round(currentVolumeLevel * 100);
      el.volumeBar.style.width = `${displayPercentage}%`;
      el.volumeText.textContent = `${displayPercentage}%`;
    }
  };

  // FORCED SHOW: Keeps the HUD completely visible while adjusting settings
  const forceShowPlayerHud = () => {
    const el = getElements();
    if (!el.hud) return;
    
    // Remove the hidden fade out class instantly
    el.hud.classList.remove('fade-out');
    clearTimeout(hudFadeTimeout);
  };

  // AUTO HIDE: Starts the hide timer countdown once keys are released
  const startAutoHideTimer = () => {
    const el = getElements();
    if (!el.hud) return;
    
    clearTimeout(hudFadeTimeout);
    if (isVideoActive && !el.video.paused) {
      hudFadeTimeout = setTimeout(() => {
        el.hud.classList.add('fade-out');
      }, 3500); // Hides controls after 3.5 seconds of user silence
    }
  };

  const initListeners = () => {
    const el = getElements();
    if (!el.video) return;

    el.video.addEventListener('timeupdate', () => {
      if (!el.video.duration) return;
      const progressPercent = (el.video.currentTime / el.video.duration) * 100;
      el.progressBar.style.width = `${progressPercent}%`;
      el.timeLabel.textContent = `${formatTime(el.video.currentTime)} / ${formatTime(el.video.duration)}`;
    });
  };

  document.addEventListener('DOMContentLoaded', initListeners);

  return {
    isActive: () => isVideoActive,
    
    launch: (title, videoSrc) => {
      isVideoActive = true;
      activeHudBtnIndex = 1; // Start focused on Play/Pause
      
      const el = getElements();
      el.movieTitle.textContent = title;
      el.video.src = videoSrc;
      el.video.volume = currentVolumeLevel;
      el.overlay.classList.remove('hidden');
      
      el.video.currentTime = 0;
      el.video.play().catch(err => console.log("Media driver auto-play blocked: ", err));
      
      syncHudButtons();
      startAutoHideTimer();
    },
    
    terminate: () => {
      isVideoActive = false;
      const el = getElements();
      el.video.pause();
      el.overlay.classList.add('hidden');
      clearTimeout(hudFadeTimeout);
    },
    
    handleInput: (key, fallbackCallback) => {
      const el = getElements();
      
      // Force UI to stay active the split-second any navigation key is tapped
      forceShowPlayerHud();
      
      switch(key) {
        case 'Backspace':
        case 'Escape':
          TVVideoEngine.terminate();
          if (fallbackCallback) fallbackCallback();
          return; // Exit early
          
        case 'ArrowLeft':
          if (activeHudBtnIndex > 0) activeHudBtnIndex--;
          syncHudButtons();
          break;
          
        case 'ArrowRight':
          if (activeHudBtnIndex < 3) activeHudBtnIndex++;
          syncHudButtons();
          break;

        case 'ArrowUp':
          // Automatically snap focus to the volume bar layout row if the user hits Up
          activeHudBtnIndex = 3; 
          currentVolumeLevel = Math.min(1.0, currentVolumeLevel + 0.05); // Step up 5%
          el.video.volume = currentVolumeLevel;
          syncHudButtons();
          break;
          
        case 'ArrowDown':
          // Automatically snap focus to the volume bar layout row if the user hits Down
          activeHudBtnIndex = 3; 
          currentVolumeLevel = Math.max(0.0, currentVolumeLevel - 0.05); // Step down 5%
          el.video.volume = currentVolumeLevel;
          syncHudButtons();
          break;
          
        case 'Enter':
        case ' ':
          if (activeHudBtnIndex === 0) {
            el.video.currentTime = Math.max(0, el.video.currentTime - 5);
          } else if (activeHudBtnIndex === 1) {
            if (el.video.paused) el.video.play(); else el.video.pause();
          } else if (activeHudBtnIndex === 2) {
            el.video.currentTime = Math.min(el.video.duration, el.video.currentTime + 5);
          } else if (activeHudBtnIndex === 3) {
            if (currentVolumeLevel > 0) {
              currentVolumeLevel = 0;
            } else {
              currentVolumeLevel = 1.0;
            }
            el.video.volume = currentVolumeLevel;
          }
          syncHudButtons();
          break;
      }

      // Reinstate the auto-hide countdown tracker only after processing completes
      startAutoHideTimer();
    }
  };
})();
