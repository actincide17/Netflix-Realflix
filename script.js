/**
 * Netflix TV Main UI Workspace Control Framework
 */
const TVDashboardEngine = (() => {
  let currentFocusZone = "HOME"; // SIDEBAR, HOME, SEARCH_BAR, SEARCH_GRID, MODAL
  let sidebarIndex = 1; 
  let searchGridIndex = 0;
  let currentRow = 0; 
  let currentCol = 0;
  let currentSearchQuery = "";

  const sidebar = () => document.getElementById('sidebarMenu');
  const scrollContainer = () => document.getElementById('scrollContainer');
  const homePanel = () => document.getElementById('homePanel');
  const searchPanel = () => document.getElementById('searchPanel');
  const searchResultsGrid = () => document.getElementById('searchResultsContainer');
  const infoModal = () => document.getElementById('infoModal');

    /* ... Locate the createMovieCard function inside script.js and update to this ... */
  const createMovieCard = (m, idx) => {
    const card = document.createElement('div'); 
    card.className = `movie-card ${idx === 0 && m.id === 'm1' ? 'active' : ''}`;
    card.setAttribute('data-id', m.id);
    
    // Set the custom background image inside the frame using your .png file asset
    if (m.logoSrc && m.logoSrc !== "") {
      card.innerHTML = `
        <div class="movie-box" style="background-image: url('${m.logoSrc}'); background-size: cover; background-position: center;">
          <!-- Title text hidden here to prevent double titles over the image background -->
        </div>`;
    } else {
      // Clean fallback background color block if no graphic thumbnail exists
      card.innerHTML = `<div class="movie-box" style="background-color: ${m.bg}"><h3>${m.title}</h3></div>`;
    }
    
    return card;
  };


  const syncGlobalInterface = () => {
    document.querySelectorAll('.movie-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-icon').forEach(i => i.classList.remove('active-focused'));
    
    const searchBox = document.getElementById('searchBoxFrame');
    if (searchBox) searchBox.classList.remove('focused');
    
    sidebar().classList.toggle('expanded', currentFocusZone === "SIDEBAR");

    if (currentFocusZone === "SIDEBAR") {
      const sbIcons = document.querySelectorAll('.sidebar-icon');
      if (sbIcons[sidebarIndex]) sbIcons[sidebarIndex].classList.add('active-focused');
    } 
    else if (currentFocusZone === "HOME") {
      const activeSlider = document.getElementById(`row${currentRow}`);
      if (activeSlider) {
        const cards = activeSlider.querySelectorAll('.movie-card');
        const activeCard = cards[currentCol];
        if (activeCard) {
          activeCard.classList.add('active');
          const mData = FILTERED_MOVIE_DATABASE.find(m => m.id === activeCard.getAttribute('data-id'));
          
          const titleArea = document.getElementById('billTitleArea');
          if (titleArea) {
            titleArea.innerHTML = "";
            // FIXED: Force the system to use text layout strings exclusively on the billboard spot
            titleArea.innerHTML = `<h1 class="billboard-title" id="billTitle">${mData.title}</h1>`;
          }

          document.getElementById('billDesc').textContent = mData.desc;
          
          const offset = -currentCol * (activeCard.offsetWidth + 16);
          activeSlider.style.transform = `translateX(${offset}px)`;
        }
      }
      scrollContainer().style.transform = `translateY(${-currentRow * 280}px)`;
    }
    else if (currentFocusZone === "SEARCH_BAR" && searchBox) {
      searchBox.classList.add('focused');
    }
    else if (currentFocusZone === "SEARCH_GRID") {
      const cards = searchResultsGrid().querySelectorAll('.movie-card');
      if (cards[searchGridIndex]) cards[searchGridIndex].classList.add('active');
    }
  };

    /* ... Find this specific section inside your script.js file ... */
  const renderSearchGrid = () => {
    const grid = searchResultsGrid();
    grid.innerHTML = "";
    
    // CHANGED: Search exclusively within the verified data array built by update.js
    const filtered = FILTERED_MOVIE_DATABASE.filter(m => 
      m.title.toLowerCase().includes(currentSearchQuery.toLowerCase())
    );
    
    if (currentSearchQuery === "") {
      grid.innerHTML = `<p style="color: #666; font-size: 1.2rem; padding-left: 0.5rem;">Type on your keyboard to discover content...</p>`;
      return;
    }
    
    if (filtered.length === 0) {
      grid.innerHTML = `<p style="color: #666; font-size: 1.2rem; padding-left: 0.5rem;">No active titles found matching "${currentSearchQuery}"</p>`;
      return;
    }
    
    // Dynamically render matching cards that passed the pre-load test
    filtered.forEach(m => {
      const card = document.createElement('div'); 
      card.className = "movie-card";
      card.setAttribute('data-id', m.id);
      
      // Keep your 1:1 image logo rendering rules intact for search results
      if (m.logoSrc && m.logoSrc !== "") {
        card.innerHTML = `
          <div class="movie-box" style="background-color: ${m.bg}; position: relative;">
            <img src="${m.logoSrc}" alt="${m.title}" class="card-logo-img">
          </div>`;
      } else {
        card.innerHTML = `<div class="movie-box" style="background-color: ${m.bg}"><h3>${m.title}</h3></div>`;
      }
      
      grid.appendChild(card);
    });
  };


  const init = () => {
    if (!document.body.classList.contains('dashboard-body')) return;

    document.getElementById('userName').textContent = localStorage.getItem('activeProfileName') || 'User';
    document.getElementById('userAvatar').src = localStorage.getItem('activeProfileAvatar') || 'Assets/Netflix-avatar1.png';

    // Renders the rows immediately if the scan finishes early
    if (isAssetScanComplete) {
      buildValidatedRows();
    } else {
      // Otherwise, wait for update.js to complete the file checks
      document.addEventListener('AssetScanFinished', buildValidatedRows);
    }
  };

  const buildValidatedRows = () => {
    const r0 = document.getElementById('row0'); 
    const r1 = document.getElementById('row1');
    if (!r0 || !r1) return;

    // Clear any hardcoded placeholders before populating active assets
    r0.innerHTML = "";
    r1.innerHTML = "";

    // Slices from the dynamically filtered array generated by update.js
    const half = Math.ceil(FILTERED_MOVIE_DATABASE.length / 2);
    const firstRowMovies = FILTERED_MOVIE_DATABASE.slice(0, half);
    const secondRowMovies = FILTERED_MOVIE_DATABASE.slice(half);

    firstRowMovies.forEach((m, i) => r0.appendChild(createMovieCard(m, i)));
    secondRowMovies.forEach((m, i) => r1.appendChild(createMovieCard(m, i)));

    syncGlobalInterface();
  };

  document.addEventListener('DOMContentLoaded', init);

  return {
    getCurrentZone: () => currentFocusZone,
    setZone: (zone) => { currentFocusZone = zone; syncGlobalInterface(); },
    
    appendSearchChar: (char) => {
      currentSearchQuery += char;
      document.getElementById('searchBarText').innerHTML = `<div id="searchBoxFrame" class="search-box-frame focused">${currentSearchQuery}</div>`;
      renderSearchGrid();
    },
    removeSearchChar: () => {
      currentSearchQuery = currentSearchQuery.slice(0, -1);
      const text = currentSearchQuery || "Search by titles... [Type on your Keyboard]";
      document.getElementById('searchBarText').innerHTML = `<div id="searchBoxFrame" class="search-box-frame focused">${text}</div>`;
      renderSearchGrid();
    },

    moveLeft: () => {
      if (currentFocusZone === "HOME") {
        if (currentCol > 0) currentCol--; else currentFocusZone = "SIDEBAR";
      } else if (currentFocusZone === "SEARCH_GRID") {
        if (searchGridIndex % 4 > 0) searchGridIndex--; else currentFocusZone = "SIDEBAR";
      } else if (currentFocusZone === "SEARCH_BAR") {
        currentFocusZone = "SIDEBAR";
      }
      syncGlobalInterface();
    },
    moveRight: () => {
      if (currentFocusZone === "HOME" && currentCol < 3) currentCol++;
      else if (currentFocusZone === "SEARCH_GRID") {
        const total = searchResultsGrid().querySelectorAll('.movie-card').length;
        if (searchGridIndex < total - 1) searchGridIndex++;
      } else if (currentFocusZone === "SIDEBAR") {
        const targetMenu = document.querySelectorAll('.sidebar-icon')[sidebarIndex].getAttribute('data-menu');
        document.querySelectorAll('.sidebar-icon').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.sidebar-icon')[sidebarIndex].classList.add('active');

        if (targetMenu === 'home') {
          homePanel().classList.remove('hidden'); searchPanel().classList.add('hidden');
          currentFocusZone = "HOME";
        } else if (targetMenu === 'search') {
          homePanel().classList.add('hidden'); searchPanel().classList.remove('hidden');
          const pl = currentSearchQuery || "Search by titles... [Type on your Keyboard]";
          document.getElementById('searchBarText').innerHTML = `<div id="searchBoxFrame" class="search-box-frame">${pl}</div>`;
          currentFocusZone = "SEARCH_BAR";
          renderSearchGrid();
        }
      }
      syncGlobalInterface();
    },
    moveUp: () => {
      if (currentFocusZone === "SIDEBAR" && sidebarIndex > 0) sidebarIndex--;
      else if (currentFocusZone === "HOME" && currentRow > 0) { currentRow--; currentCol = 0; }
      else if (currentFocusZone === "SEARCH_GRID") {
        if (searchGridIndex >= 4) searchGridIndex -= 4; else currentFocusZone = "SEARCH_BAR";
      }
      syncGlobalInterface();
    },
    moveDown: () => {
      if (currentFocusZone === "SIDEBAR" && sidebarIndex < 2) sidebarIndex++;
      else if (currentFocusZone === "HOME" && currentRow < 1) { currentRow++; currentCol = 0; }
      else if (currentFocusZone === "SEARCH_BAR") {
        if (searchResultsGrid().querySelectorAll('.movie-card').length > 0) {
          currentFocusZone = "SEARCH_GRID"; searchGridIndex = 0;
        }
      }
      syncGlobalInterface();
    },
    executeSelection: () => {
      if (currentFocusZone === "SIDEBAR") {
        TVDashboardEngine.moveRight();
      } else if (currentFocusZone === "HOME") {
        const card = document.getElementById(`row${currentRow}`).querySelectorAll('.movie-card')[currentCol];
        openInfoModal(card.getAttribute('data-id'));
      } else if (currentFocusZone === "SEARCH_GRID") {
        const card = searchResultsGrid().querySelectorAll('.movie-card')[searchGridIndex];
        openInfoModal(card.getAttribute('data-id'));
      } else if (currentFocusZone === "MODAL") {
        infoModal().classList.add('hidden');
        
        // Target your verified scanned records list instead of standard MOVIE_DATABASE
        const m = FILTERED_MOVIE_DATABASE.find(x => x.id === infoModal().getAttribute('data-active-id'));
        currentFocusZone = "PLAYER";
        
        // Pass parameters down cleanly into the separated video.js engine module
        TVVideoEngine.launch(m.title, m.videoSrc);
      }
    },
    executeBackAction: () => {
      if (currentFocusZone === "MODAL") {
        infoModal().classList.add('hidden');
        currentFocusZone = searchPanel().classList.contains('hidden') ? "HOME" : "SEARCH_GRID";
        syncGlobalInterface();
      } else if (currentFocusZone === "SEARCH_BAR") {
        currentSearchQuery = "";
        document.getElementById('searchBarText').innerHTML = `<div id="searchBoxFrame" class="search-box-frame focused">Search by titles... [Type on your Keyboard]</div>`;
        renderSearchGrid();
      }
    }
  };

  function openInfoModal(movieId) {
    currentFocusZone = "MODAL";
    const m = MOVIE_DATABASE.find(x => x.id === movieId);
    document.getElementById('infoModalTitle').textContent = m.title;
    document.getElementById('infoModalYear').textContent = m.year;
    document.getElementById('infoModalDesc').textContent = m.desc;
    infoModal().setAttribute('data-active-id', movieId);
    infoModal().classList.remove('hidden');
  }
})();
