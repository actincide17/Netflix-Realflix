/**
 * Netflix TV Keybindings Configuration Manager
 */
const TVControlsManager = (() => {
  // Action event routing dictionary mapping 
  const keyMap = {
    NAV_UP:    'ArrowUp',
    NAV_DOWN:  'ArrowDown',
    NAV_LEFT:  'ArrowLeft',
    NAV_RIGHT: 'ArrowRight',
    SELECT:    'Enter',
    ESCAPE:    'Escape',
    BACKSPACE: 'Backspace',
    SPACE:     ' '
  };

  const init = () => {
    // Exit early if we are on the profile landing page
    if (document.getElementById('profileGate')) return;

    window.addEventListener('keydown', (e) => {
      const currentZone = TVDashboardEngine.getCurrentZone();

      // 1. If Video Player is Active -> Route directly to video.js
      if (TVVideoEngine.isActive()) {
        TVVideoEngine.handleInput(e.key, () => {
          TVDashboardEngine.setZone("MODAL");
        });
        return;
      }

      // 2. If Keyboard Search Typing Box is Active -> Feed chars directly
      if (currentZone === "SEARCH_BAR") {
        if (e.key.length === 1) {
          TVDashboardEngine.appendSearchChar(e.key);
          return;
        }
        if (e.key === keyMap.BACKSPACE) {
          TVDashboardEngine.removeSearchChar();
          return;
        }
      }

      // 3. System Spatial Grid Processing Rules
      switch (e.key) {
        case keyMap.NAV_LEFT:
          TVDashboardEngine.moveLeft();
          break;
        case keyMap.NAV_RIGHT:
          TVDashboardEngine.moveRight();
          break;
        case keyMap.NAV_UP:
          TVDashboardEngine.moveUp();
          break;
        case keyMap.NAV_DOWN:
          TVDashboardEngine.moveDown();
          break;
        case keyMap.SELECT:
          TVDashboardEngine.executeSelection();
          break;
        case keyMap.ESCAPE:
        case keyMap.BACKSPACE:
          TVDashboardEngine.executeBackAction();
          break;
      }
    });
  };

  document.addEventListener('DOMContentLoaded', init);

  return {
    KEYS: keyMap
  };
})();
