// Lista de flujos
const streams = ['stream1', 'stream2', 'stream3', 'stream4'];
// Contenedor (CSS Grid)
const videosContainer = document.getElementById('videos');

// Ajustar el diseño del grid dinámicamente
const adjustGrid = () => {
    const streamCount = streams.length;

    // Determina las filas y columnas según el número de flujos
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

    // Actualiza las propiedades del contenedor
    videosContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    videosContainer.style.gridTemplateRows = `repeat(${rows}, auto)`;
};

// Recorremos la lista de flujos
streams.forEach(streamId => {
    // Creamos un contenedor para cada flujo
    const videoWrapper = document.createElement('div');
    // Creamos su elemento 'video'
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;

    // Obtenemos la fuente del flujo
    const videoSrc = `/hls/${streamId}/output.m3u8`;

    // Comprobamos si el navegador soporta HLS.js
    if (Hls.isSupported()) {
        // Cargamos el flujo de vídeo y lo conectamos al reproductor
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        // Comprobamos si el navegador tiene soporte nativo para HLS (Safari)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }

    // Añadimos el vídeo a su contenedor, y el contenedor al grid
    videoWrapper.appendChild(video);
    videosContainer.appendChild(videoWrapper);
});

// Ajustar el grid después de añadir los videos
adjustGrid();
