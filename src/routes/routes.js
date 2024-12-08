const express = require('express');
const path = require('path');
const startFFmpeg = require('../controllers/ffmpegController');
const db = require('../utils/db');
const config = require('../../config/default');

const router = express.Router();
const loginHTML = config.paths.htmlFiles.login;
const streamsHTML = config.paths.htmlFiles.streams;
const outputFolder = config.paths.outputFolder;

// Ruta principal para mostrar la página de login
router.get('/', (_req, res) => {
    res.sendFile(loginHTML);
});

// Ruta para la página de visualización de flujos
router.get('/streams', (_req, res) => {
    res.sendFile(streamsHTML);
});

// Endpoint para iniciar sesión
router.post('/api/login', (req, res) => {
    // Obtenemos el usuario y contraseña de la solicitud
    const { username, password } = req.body;

    // Comprobamos que se hayan cubiertos ambos campos
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing mandatory fields' });
    }

    try {
        // Hacemos una consulta a la base de datos para obtener el usuario correspondiente a los datos introducidos
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

        // Comprobamos si el usuario existe
        if (user) {
            res.status(200);
        } else {
            res.status(401).json({ error: 'Wrong user or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Endpoint para registrar un usuario
router.post('/api/register', (req, res) => {
    // Obtenemos el usuario y contraseña de la solicitud
    const { username, password } = req.body;

    // Comprobamos que se hayan cubiertos ambos campos
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing mandatory fields' });
    }

    try {
        // Hacemos una consulta a la base de datos para obtener el usuario correspondiente a los datos introducidos
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        // Comprobamos si el usuario ya existe
        if (user) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hacemos una consulta a la base de datos para crear el nuevo usuario
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
        res.status(201);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Servimos los archivos HLS de cada flujo dinámicamente
router.use('/hls/:id', (req, res) => {
    // Obtenemos el path del flujo
    const streamId = req.params.id;
    const streamPath = path.join(outputFolder, streamId);

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