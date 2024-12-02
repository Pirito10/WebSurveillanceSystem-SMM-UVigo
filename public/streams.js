// Lista de flujos
let streams = JSON.parse(localStorage.getItem('streams')) || [];
// Contenedor de flujos (CSS Grid)
const videosContainer = document.getElementById('videos');

// Ajustar el diseño del grid dinámicamente
const adjustGrid = () => {
    const streamCount = streams.length;
    // Para un flujo, ocupamos toda la columna
    if (streamCount === 1) {
        videosContainer.style.gridTemplateColumns = '1fr';
        // Para dos flujos, uno por cada columna
    } else if (streamCount === 2) {
        videosContainer.style.gridTemplateColumns = '1fr 1fr';
        // Para tres o cuatro flujos, mantenemos dos columnas
    } else if (streamCount <= 4) {
        videosContainer.style.gridTemplateColumns = '1fr 1fr';
        // Para más, ajustamos dinámicamente
    } else {
        videosContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    }
};

// Función para añadir un nuevo flujo
const addStream = (streamId, videoSrc) => {
    // Creamos un contenedor para cada flujo
    const videoWrapper = document.createElement('div');
    // Creamos su elemento 'video'
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;

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

    // Reajustamos el grid
    adjustGrid();
};

// Listener para el botón de añadir flujo
document.getElementById('addStreamButton').addEventListener('click', async () => {
    // Leemos la URL del campo de texto
    const inputField = document.getElementById('streamUrl');
    const streamUrl = inputField.value.trim();

    if (!streamUrl) {
        alert('Por favor, introduce una URL válida.');
        return;
    }

    // Generaramos un nuevo ID para el flujo
    const streamId = `stream${streams.length + 1}`;
    streams.push(streamId);

    // Guardamos el flujo en el almacenamiento local
    localStorage.setItem('streams', JSON.stringify(streams));

    // Obtenemos la fuente del flujo y la añadimos
    const videoSrc = `/hls/${streamId}/output.m3u8`;
    addStream(streamId, videoSrc);

    // Llamamos al comando FFmpeg en el servidor
    try {
        const response = await fetch('/api/start-ffmpeg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: streamId, url: streamUrl }),
        });

        if (!response.ok) {
            throw new Error(`Error al iniciar FFmpeg: ${await response.text()}`);
        }
    } catch (err) {
        console.error(err);
        alert('Error al iniciar el flujo en el servidor.');
    }

    // Limpiamos el campo de texto
    inputField.value = '';
});

// Al cargar la página, renderizamos los flujos almacenados en el almacenamiento local
window.onload = () => {
    streams.forEach(streamId => {
        const videoSrc = `/hls/${streamId}/output.m3u8`;
        addStream(streamId, videoSrc);
    });
};