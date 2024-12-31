const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../../config/default');
const db = require('../utils/db');
const { startFFmpeg, stopFFmpeg, recordStream } = require('../controllers/ffmpegController');
const { hashPassword, verifyPassword } = require('../utils/utils');

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
            res.status(404).send('User does not exist');
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

// Endpoint para actualizar los parámetros de un flujo en la base de datos
router.put('/api/streams/:name', (req, res) => {
    // Obtenemos el nombre del flujo y los parámetros de la solicitud
    const streamName = req.params.name;
    const params = req.body.params;

    try {
        // Actualizamos los parámetros del flujo en la base de datos
        db.prepare(`UPDATE streams SET codec = ?, resolution = ?, framerate = ?, preset = ?, bitrate = ?, recordingDuration = ? WHERE name = ?`).run(params.codec || config.ffmpeg.defaultParams.codec, params.resolution || config.ffmpeg.defaultParams.resolution, params.framerate || config.ffmpeg.defaultParams.framerate, params.preset || config.ffmpeg.defaultParams.preset, params.bitrate || config.ffmpeg.defaultParams.bitrate, params.recordingDuration || config.ffmpeg.recordingParams.duration, streamName);

        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para actualizar el estado de la grabación de un flujo en la base de datos
router.put('/api/streams/:name/record', (req, res) => {
    // Obtenemos el nombre del flujo y el estado de la grabación de la solicitud
    const streamName = req.params.name;
    const recording = req.body.recording;

    try {
        // Actualizamos el estado de la grabación del flujo en la base de datos
        db.prepare('UPDATE streams SET recording = ? WHERE name = ?').run(recording ? 1 : 0, streamName);
        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para descargar la grabación de un flujo
router.get('/api/streams/:name/download', async (req, res) => {
    // Obtenemos el nombre del flujo de la solicitud
    const streamName = req.params.name;

    try {
        // Generamos el fichero MP4 con la grabación
        const recordingFile = await recordStream(streamName);

        // Enviamos el fichero al cliente
        res.download(recordingFile, `${streamName}.mp4`, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Internal error');
            }

            // Eliminamos el fichero después de enviarlo
            fs.unlinkSync(recordingFile);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

// Endpoint para eliminar un flujo de la base de datos
router.delete('/api/streams/:name', async (req, res) => {
    // Obtenemos el nombre del flujo de la solicitud
    const streamName = req.params.name;

    try {
        // Hacemos una consulta a la base de datos para obtener el flujo correspondiente al nombre introducido
        const stream = db.prepare('SELECT * FROM streams WHERE name = ?').get(streamName);

        if (stream) {
            // Eliminamos el flujo de la base de datos
            db.prepare('DELETE FROM streams WHERE name = ?').run(streamName);

            // Detenemos el proceso FFmpeg
            stopFFmpeg(streamName);
            res.status(200).send();
        } else {
            res.status(404).send('Stream does not exist');
        }
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
        const streams = db.prepare('SELECT id, name, url, recording FROM streams WHERE user_id = ?').all(userID);
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

    try {
        // Obtenemos los parámetros configurables del flujo de la base de datos
        const params = db.prepare(`SELECT codec, resolution, framerate, preset, bitrate, recording, recordingDuration FROM streams WHERE name = ?`).get(streamName);

        // Iniciamos el proceso FFmpeg
        startFFmpeg(streamName, streamUrl, params);
        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal error');
    }
});

module.exports = router;