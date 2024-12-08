const express = require('express');
const path = require('path');
const startFFmpeg = require('../controllers/ffmpegController');
const db = require('../utils/db');
const config = require('../../config/default');

const router = express.Router();
const baseOutputFolder = path.resolve(config.paths.outputFolder);

// Ruta principal para mostrar la página de login
router.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/login.html'));
});

// Ruta para la página de visualización de flujos
router.get('/streams', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/streams.html'));
});

// Endpoint para iniciar sesión
router.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
        if (user) {
            res.status(200).json({ message: 'Inicio de sesión exitoso', user });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Endpoint para registrar un usuario
router.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }

        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Servimos los archivos HLS de cada flujo dinámicamente
router.use('/hls/:id', (req, res) => {
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