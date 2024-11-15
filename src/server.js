const express = require('express');
const path = require('path');
const { startFFmpeg, stopFFmpeg } = require('./ffmpegRunner');

const app = express();
const outputFolder = path.join(__dirname, '../output'); // Carpeta donde se guardan los archivos HLS
const inputUrl = 'http://192.168.0.7:8080/video'; // URL del flujo de entrada

// Inicia FFmpeg al arrancar el servidor
startFFmpeg(inputUrl, outputFolder);

// Servir los archivos HLS
app.use('/hls', express.static(outputFolder));

// Página principal para mostrar el video
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>HLS Streaming</title>
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        </head>
        <body>
            <h1>Streaming en Vivo</h1>
            <video id="video" controls autoplay width="640" height="360"></video>
            <script>
                const video = document.getElementById('video');
                const videoSrc = '/hls/output.m3u8';

                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(videoSrc);
                    hls.attachMedia(video);
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = videoSrc; // Para navegadores con soporte nativo HLS (Safari)
                } else {
                    console.error('El navegador no soporta HLS.');
                }
            </script>
        </body>
        </html>
    `);
});

// Ruta para detener FFmpeg manualmente (opcional)
app.get('/stop-ffmpeg', (req, res) => {
    stopFFmpeg();
    res.send('FFmpeg detenido.');
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
