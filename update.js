/**
 * Netflix TV Local Video & Logo Asset Availability Scanner
 */
let FILTERED_MOVIE_DATABASE = [];
let isAssetScanComplete = false;

const TVAssetScanner = (() => {
  // Helper to check if a video file path is active and reachable
  const checkVideoExists = (videoSrc) => {
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.src = videoSrc;
      tempVideo.preload = 'auto';

      tempVideo.onloadedmetadata = () => resolve(true);
      tempVideo.onerror = () => resolve(false);
    });
  };

  const verifyVideoFiles = async () => {
    const verifiedList = [];

    // Loop through the movie selection data registered inside select.js
    for (const movie of MOVIE_DATABASE) {
      const exists = await checkVideoExists(movie.videoSrc);
      
      if (exists) {
        // FIXED: Explicitly clone the entire movie object, including the logoSrc string!
        verifiedList.push({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          bg: movie.bg,
          videoSrc: movie.videoSrc,
          logoSrc: movie.logoSrc || "", // Transfers Logo-1.png safely
          desc: movie.desc
        });
        console.log(`Notflix Sync Scanner: Successfully validated [${movie.title}]`);
      } else {
        console.warn(`Notflix Sync Scanner: Asset unplayable or path missing: ${movie.videoSrc}`);
      }
    }

    // Export the array globally for script.js to pick up
    FILTERED_MOVIE_DATABASE = verifiedList;
    isAssetScanComplete = true;

    // Trigger the rendering workflow hook
    document.dispatchEvent(new CustomEvent('AssetScanFinished'));
  };

  document.addEventListener('DOMContentLoaded', verifyVideoFiles);
})();
