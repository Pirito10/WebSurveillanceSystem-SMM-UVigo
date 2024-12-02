const express = require('express');
const path = require('path');
const fs = require('fs');
//Fichero con configuraciones varias
const config = require('../config/default');
//Script para la ejecución de FFmpeg
const { startFFmpeg } = require('./controllers/ffmpegRunner');

const app = express();
app.use(express.json());

// Crear los directorios necesarios
const baseOutputFolder = path.resolve(config.paths.outputFolder); //Directorio output (para los flujos de vídeo)
const logsFolder = path.resolve(config.paths.logsFolder); //Directorio de logs
if (!fs.existsSync(baseOutputFolder)) {
    fs.mkdirSync(baseOutputFolder, { recursive: true });
    console.log(`[Server] Directory created: ${baseOutputFolder}`);
}
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder, { recursive: true });
    console.log(`[Server] Directory created: ${logsFolder}`);
}

// Configuración de la carpeta pública (html, css...)
const staticFolder = path.resolve(config.server.staticFolder);
app.use(express.static(staticFolder));

// Servir los archivos HLS de cada flujo dinámicamente
app.use('/hls/:id', (req, res, next) => {
    const streamId = req.params.id;
    const streamPath = path.join(baseOutputFolder, streamId);
    if (fs.existsSync(streamPath)) {
        express.static(streamPath)(req, res, next); // Sirve los archivos desde el subdirectorio correspondiente
    } else {
        res.status(404).send('Stream not found');
    }
});

// Endpoint para iniciar FFmpeg
app.post('/api/start-ffmpeg', (req, res) => {
    const { id, url } = req.body;

    if (!id || !url) {
        return res.status(400).send('Faltan parámetros (id o url).');
    }

    try {
        startFFmpeg(id, url);
        res.status(200).send('FFmpeg iniciado correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al iniciar FFmpeg.');
    }
});

// Iniciar el servidor
const port = config.server.port;
app.listen(port, () => {
    console.log(`\n[Server] Server running on http://localhost:${port}\n`);
});