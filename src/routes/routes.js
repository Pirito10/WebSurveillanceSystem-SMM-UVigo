const express = require('express');
const path = require('path');
const startFFmpeg = require('../controllers/ffmpegController');
const db = require('../utils/db');
const { hashPassword, verifyPassword } = require('../utils/utils');
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
router.post('/api/login', async (req, res) => {
    // Obtenemos el usuario y contraseña de la solicitud
    const username = req.body.username;
    const password = req.body.password;

    // Comprobamos que se hayan cubiertos ambos campos
    if (!username || !password) {
        return res.status(400).send('Missing mandatory fields');
    }

    try {
        // Hacemos una consulta a la base de datos para obtener el usuario correspondiente a los datos introducidos
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        // Comprobamos si el usuario existe
        if (user) {
            // Verificamos la contraseña
            if (await verifyPassword(password, user.password)) {
                // Enviamos el ID del usuario en la respuesta
                res.status(200).send(`${user.id}`);
            } else {
                res.status(401).send('Wrong password');
            }
        } else {
            res.status(401).send('User does not exist');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para registrar un usuario
router.post('/api/register', async (req, res) => {
    // Obtenemos el usuario y contraseña de la solicitud
    const username = req.body.username;
    const password = req.body.password;

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

        // Hasheamos la contraseña
        const hashedPassword = await hashPassword(password);

        // Insertamos el nuevo usuario a la base de datos
        const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
        // Obtenemos el ID del usuario
        const userID = result.lastInsertRowid;

        res.status(201).send(`${userID}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para añadir un flujo a la base de datos
router.post('/api/streams', (req, res) => {
    // Obtenemos el usuario y la URL de la solicitud
    const userID = req.body.userID;
    const streamUrl = req.body.streamUrl;

    try {
        // Insertamos el flujo en la base de datos
        const result = db.prepare('INSERT INTO streams (user_id, url) VALUES (?, ?)').run(userID, streamUrl);
        // Obtenemos el ID generado
        const streamID = result.lastInsertRowid;

        // Generamos el nombre del flujo basado en el ID
        const streamName = `stream${streamID}`;

        // Actualizamos la entrada de la base de datos con el nombre del flujo
        db.prepare('UPDATE streams SET name = ? WHERE id = ?').run(streamName, streamID);
        res.status(201).send(`${streamName}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para devolver los flujos de un usuario
router.get('/api/streams/:userID', (req, res) => {
    // Obtenemos el usuario de la solicitud
    const userID = req.params.userID;

    try {
        // Hacemos una consulta a la base de datos para obtener los flujos del usuario
        const streams = db.prepare('SELECT id, name, url FROM streams WHERE user_id = ?').all(userID);
        // Devolvemos la lista de flujos en la respuesta
        res.status(200).json(streams);
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
    const streamName = req.body.streamName;
    const streamUrl = req.body.streamUrl;

    // Intentamos ejecutar el comando FFmpeg correspondiente
    try {
        startFFmpeg(streamName, streamUrl);
        res.status(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

module.exports = router;