// Contenedor de flujos (CSS Grid)
const videosContainer = document.getElementById('videos');

// Ajustar el diseño del grid dinámicamente
const adjustGrid = () => {
    const streamCount = videosContainer.childElementCount;
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
const addStream = (videoSrc) => {
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
        alert('Please, introduce an URL');
        return;
    }

    // Obtenemos el ID del usuario del almacenamiento de la sesión
    const userID = sessionStorage.getItem('userID');

    // Si no existe, redirigimos a la pantalla de inicio de sesión
    if (!userID) {
        window.location.href = '/';
        return;
    }

    try {
        // Guardamos el flujo en la base de datos
        const response = await fetch('/api/streams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userID, streamUrl }),
        });

        if (response.ok) {
            // Obtenemos el nombre del flujo de la respuesta
            const streamName = await response.text();

            // Obtenemos la fuente del flujo y la añadimos
            const videoSrc = `/hls/${streamName}/output.m3u8`;
            addStream(videoSrc);

            // Llamamos al comando FFmpeg en el servidor
            await fetch('/api/start-ffmpeg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: streamName, url: streamUrl }),
            });
        } else {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }

    // Limpiamos el campo de texto
    inputField.value = '';
});

// Función para cargar los flujos del usuario desde el servidor
window.onload = async () => {
    // Obtenemos el ID del usuario del almacenamiento de la sesión
    const userID = sessionStorage.getItem('userID');

    // Si no existe, redirigimos a la pantalla de inicio de sesión
    if (!userID) {
        window.location.href = '/';
        return;
    }

    try {
        // Hacemos una solicitud para obtener los flujos del usuario
        const response = await fetch(`/api/streams/${userID}`);

        if (response.ok) {
            // Obtenemos la lista de flujos de la respuesta
            const streams = await response.json();

            streams.forEach(async (stream) => {
                // Añadimos el reproductor para cada flujo
                const videoSrc = `/hls/${stream.name}/output.m3u8`;
                addStream(videoSrc);

                // Llamamos al correspondiente comando FFmpeg en el servidor
                await fetch('/api/start-ffmpeg', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: stream.name, url: stream.url }),
                });
            });
        } else {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }
};