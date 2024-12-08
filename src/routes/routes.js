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
        return res.status(400).send('Missing mandatory fields');
    }

    try {
        // Hacemos una consulta a la base de datos para obtener el usuario correspondiente a los datos introducidos
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

        // Comprobamos si el usuario existe
        if (user) {
            res.status(200);
        } else {
            res.status(401).send('Wrong user or password');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para registrar un usuario
router.post('/api/register', (req, res) => {
    // Obtenemos el usuario y contraseña de la solicitud
    const { username, password } = req.body;

    // Comprobamos que se hayan cubiertos ambos campos
    if (!username || !password) {
        return res.status(400).send('Missing mandatory fields');
    }

    try {
        // Hacemos una consulta a la base de datos para obtener el usuario correspondiente a los datos introducidos
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        // Comprobamos si el usuario ya existe
        if (user) {
            return res.status(409).send('User already exists');
        }

        // Hacemos una consulta a la base de datos para crear el nuevo usuario
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
        res.status(201);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para añadir un flujo a la base de datos
router.post('/api/streams', (req, res) => {
    // Obtenemos el usuario y la URL de la solicitud
    const { userId, url } = req.body;

    try {
        // Insertamos el flujo en la base de datos
        const result = db.prepare('INSERT INTO streams (user_id, url) VALUES (?, ?)').run(userId, url);
        // Obtenemos el ID generado
        const streamId = result.lastInsertRowid;

        // Generamos el nombre del flujo basado en el ID
        const name = `stream${streamId}`;

        // Actualizamos la entrada de la base de datos con el nombre del flujo
        db.prepare('UPDATE streams SET name = ? WHERE id = ?').run(name, streamId);
        res.status(201);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});


// Endpoint para servir los archivos HLS de cada flujo dinámicamente
router.use('/hls/:id', (req, res) => {
    // Obtenemos la ruta al flujo
    const streamPath = path.join(outputFolder, req.params.id);

    // Servirmos los ficheros
    express.static(streamPath)(req, res, (err) => {
        // Comprobamos que existe el flujo
        if (err) {
            res.status(404).send('Stream not found');
        }
    });
});

// Endpoint para iniciar FFmpeg
router.post('/api/start-ffmpeg', (req, res) => {
    // Obtenemos el ID y la URL de la solicitud
    const { id, url } = req.body;

    // Intentamos ejecutar el comando FFmpeg correspondiente
    try {
        startFFmpeg(id, url);
        res.status(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

module.exports = router;