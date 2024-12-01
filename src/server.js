const express = require('express');
const path = require('path');
const fs = require('fs');
//Fichero con configuraciones varias
const config = require('../config/default');
//Script para la ejecución de FFmpeg
const { startFFmpeg } = require('./controllers/ffmpegRunner');

const app = express();

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

// Iniciar dos flujos al arrancar el servidor
startFFmpeg('stream1', 'http://192.168.0.7:8080/video');
startFFmpeg('stream2', 'http://192.168.0.8:8080/video');

// Iniciar el servidor
const port = config.server.port;
app.listen(port, () => {
    console.log(`\n[Server] Server running on http://localhost:${port}\n`);
});
