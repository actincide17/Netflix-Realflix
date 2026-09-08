/**
 * Netflix TV Profile Selection Engine
 */
const TVProfileManager = (() => {
  let currentIndex = 0;
  let focusOnButton = false;

  const getElements = () => ({
    cards: document.querySelectorAll('.profile-card'),
    manageBtn: document.getElementById('manageBtn'),
    spinner: document.getElementById('spinnerOverlay')
  });

  const syncUI = () => {
    const el = getElements();
    if (!el.manageBtn) return;

    el.cards.forEach(card => card.classList.remove('active'));
    el.manageBtn.classList.remove('active');

    if (focusOnButton) {
      el.manageBtn.classList.add('active');
    } else if (el.cards[currentIndex]) {
      el.cards[currentIndex].classList.add('active');
    }
  };

  const init = () => {
    if (!document.getElementById('profileGate')) return;

    window.addEventListener('keydown', (e) => {
      const el = getElements();

      if (focusOnButton) {
        if (e.key === 'ArrowUp') {
          focusOnButton = false;
          syncUI();
        } else if (e.key === 'Enter') {
          alert("Profile management console active.");
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) currentIndex--;
          break;
        case 'ArrowRight':
          if (el.cards && currentIndex < el.cards.length - 1) currentIndex++;
          break;
        case 'ArrowDown':
          focusOnButton = true;
          break;
        case 'Enter':
          if (!el.cards[currentIndex]) break;
          const name = el.cards[currentIndex].getAttribute('data-name');
          const avatar = el.cards[currentIndex].getAttribute('data-avatar');

          // Save selected data across multi-page boundaries
          localStorage.setItem('activeProfileName', name);
          localStorage.setItem('activeProfileAvatar', avatar);

          // Trigger red spinner animation
          el.spinner.classList.remove('hidden');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
          break;
      }
      syncUI();
    });

    syncUI();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
