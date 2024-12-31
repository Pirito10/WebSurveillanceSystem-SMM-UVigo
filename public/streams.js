// Contenedor de flujos (CSS Grid)
const videosContainer = document.getElementById('videos');

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

            // Llamamos al correspondiente comando FFmpeg en el servidor
            requestFFmpeg(streamName, streamUrl);

            // Añadimos el flujo a la interfaz
            addStream(streamName, streamUrl);
        } else {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }

    // Limpiamos el campo de texto
    inputField.value = '';
});

// Función para ajustar el diseño del grid dinámicamente
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
const addStream = (streamName, streamUrl) => {
    // Creamos un contenedor para cada flujo
    const videoWrapper = document.createElement('div');
    videoWrapper.id = streamName;

    // Creamos su elemento 'video'
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;

    // Comprobamos si el navegador soporta HLS.js
    if (Hls.isSupported()) {
        // Cargamos el flujo de vídeo y lo conectamos al reproductor
        const hls = new Hls({
            // Hacemos una solicitud al manifiesto cada segundo
            manifestLoadPolicy: {
                default: {
                    maxLoadTimeMs: 1000,
                    timeoutRetry: {
                        maxNumRetry: 10
                    }
                }
            }
        });
        const videoSrc = `/hls/${streamName}/output.m3u8`;
        hls.loadSource(videoSrc);
        hls.attachMedia(video);

        // Manejamos los errores de HLS
        hls.on(Hls.Events.ERROR, function (_event, data) {
            if (data.fatal) {
                console.error('HLS.js encountered a fatal error:', data);
                hls.startLoad();
            }
        });

        // Comprobamos si el navegador tiene soporte nativo para HLS (Safari)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }

    // Creamos el botón de configuración
    const configButton = document.createElement('button');
    configButton.textContent = 'Settings';
    configButton.addEventListener('click', () => {
        configureStream(streamName, streamUrl);
    });

    // Creamos el selector de comenzar grabación
    const recordSwitch = document.createElement('div');
    const recordSwitchLabel = document.createElement('label');
    const recordSwitchInput = document.createElement('input');
    recordSwitchInput.type = 'checkbox';
    recordSwitchInput.checked = false;
    recordSwitchInput.addEventListener('change', () => {
        toggleRecording(streamName, recordSwitchInput.checked);
    });
    recordSwitchLabel.appendChild(recordSwitchInput);
    recordSwitch.appendChild(recordSwitchLabel);

    // Creamos el botón de guardar grabación
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save recording';
    saveButton.addEventListener('click', () => {
        saveRecording(streamName);
    });

    // Creamos el botón de eliminar
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
        removeStream(streamName);
    });

    // Añadimos el vídeo a su contenedor, los botones, y el contenedor al grid
    videoWrapper.appendChild(video);
    videoWrapper.appendChild(configButton);
    videoWrapper.appendChild(recordSwitch);
    videoWrapper.appendChild(saveButton);
    videoWrapper.appendChild(deleteButton);
    videosContainer.appendChild(videoWrapper);

    // Reajustamos el grid
    adjustGrid();
};

// Función para eliminar un flujo
const removeStream = async (streamName) => {
    try {
        // Eliminamos el flujo de la base de datos
        const response = await fetch(`/api/streams/${streamName}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            // Eliminamos el flujo del grid
            document.getElementById(streamName).remove();

            // Reajustamos el grid
            adjustGrid();
        } else {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }
};

// Función para abrir la ventana de configuración
const configureStream = (streamName, streamUrl) => {
    // Mostramos la ventana
    const modal = document.getElementById('configModal');
    modal.style.display = 'flex';

    // Añadimos el botón de cerrar
    const closeModal = document.getElementById('closeModal');
    closeModal.onclick = () => {
        // Ocultamos el modal
        modal.style.display = 'none';
    };

    // Añadimos el botón de aplicar
    const applyButton = document.getElementById('applyConfig');
    applyButton.onclick = async () => {
        // Obtenemos los datos del formulario
        const form = document.getElementById('configForm');
        const formData = new FormData(form);
        const params = {
            codec: formData.get('codec'),
            resolution: formData.get('resolution'),
            framerate: formData.get('framerate'),
            preset: formData.get('preset'),
            bitrate: formData.get('bitrate') ? `${formData.get('bitrate')}k` : '',
        };

        // Actualizamos los parámetros del flujo en la base de datos
        try {
            const response = await fetch(`/api/streams/${streamName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ params }),
            });

            if (response.ok) {
                // Reiniciamos el flujo
                requestFFmpeg(streamName, streamUrl);

                // Ocultamos el modal
                modal.style.display = 'none';
            } else {
                console.error(await response.text());
            }
        } catch {
            console.error(error);
        }
    };
};

// Función para solicitar el arranque de un proceso FFmpeg
const requestFFmpeg = async (streamName, streamUrl) => {
    try {
        // Solicitamos al servidor que inicie un proceso FFmpeg
        const response = await fetch('/api/start-ffmpeg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ streamName, streamUrl }),
        });

        if (!response.ok) {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }
};

// Función para iniciar la grabación de un flujo
const toggleRecording = async (streamName, isRecording) => {
    // Actualizamos el estado de grabación del flujo en la base de datos
    try {
        const response = await fetch(`/api/streams/${streamName}/record`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRecording }),
        });

        if (response.ok) {
            console.log(`Recording ${isRecording ? 'started' : 'stopped'} for stream ${streamName}`);
        } else {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }
};

// Función para guardar la grabación de un flujo
const saveRecording = async () => { };

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
                // Obtenemos el nombre y URL del flujo
                const streamName = stream.name;
                const streamUrl = stream.url;

                // Llamamos al correspondiente comando FFmpeg en el servidor
                requestFFmpeg(streamName, streamUrl);

                // Añadimos el flujo a la interfaz
                addStream(streamName, streamUrl);
            });
        } else {
            console.error(await response.text());
        }
    } catch (error) {
        console.error(error);
    }
};