// IDs de los flujos
const streams = ['stream1'];
const videosContainer = document.getElementById('videos');

// Ajustar el diseño del grid dinámicamente
const adjustGrid = () => {
    const streamCount = streams.length;

    // Determina las filas y columnas según el número de streams
    let rows, cols;

    if (streamCount === 1) {
        rows = 1;
        cols = 1;
    } else if (streamCount === 2) {
        rows = 1;
        cols = 2;
    } else if (streamCount === 3) {
        rows = 2;
        cols = 2;
    } else if (streamCount === 4) {
        rows = 2;
        cols = 2;
    } else if (streamCount <= 6) {
        rows = 3;
        cols = 2;
    } else if (streamCount <= 9) {
        rows = 3;
        cols = 3;
    } else {
        rows = Math.ceil(streamCount / 3); // A partir de 10, mantén 3 columnas
        cols = 3;
    }

    // Actualiza las propiedades del contenedor grid
    videosContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    videosContainer.style.gridTemplateRows = `repeat(${rows}, auto)`;
};

// Añadir los videos
streams.forEach(streamId => {
    const videoWrapper = document.createElement('div');
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;

    const videoSrc = `/hls/${streamId}/output.m3u8`;
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }

    videoWrapper.appendChild(video);
    videosContainer.appendChild(videoWrapper);
});

// Ajustar el grid después de añadir los videos
adjustGrid();
