const express = require('express');
const path = require('path');
const fs = require('fs');
const { startFFmpeg } = require('../controllers/ffmpegRunner');
const config = require('../../config/default');

const router = express.Router();
const baseOutputFolder = path.resolve(config.paths.outputFolder);

// Servimos los archivos HLS de cada flujo dinámicamente
router.use('/hls/:id', (req, res, next) => {
    // Obtenemos el path del flujo
    const streamId = req.params.id;
    const streamPath = path.join(baseOutputFolder, streamId);

    // Comprobamos si existe el flujo
    express.static(streamPath)(req, res, (err) => {
        if (err) {
            res.status(404).send('Stream not found');
        }
    });
});

// Endpoint para iniciar FFmpeg
router.post('/api/start-ffmpeg', (req, res) => {
    // Obtenemos la ID y la URL
    const { id, url } = req.body;

    // Comprobamos si los parámetros son correctos
    if (!id || !url) {
        return res.status(400).send('Faltan parámetros (id o url).');
    }

    try {
        // Ejecutamos el comando FFmpeg
        startFFmpeg(id, url);
        res.status(200).send('FFmpeg iniciado correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al iniciar FFmpeg.');
    }
});

module.exports = router;