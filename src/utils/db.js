const path = require('path');
const database = require('better-sqlite3');
const config = require('../../config/default'); // Fichero de configuración
const { createDirectory } = require('../utils/utils'); // Fichero de útiles

// Creamos el directorio para almacenar la base de datos si no existe
const dataFolder = path.resolve(config.paths.dataFolder);
createDirectory(dataFolder, 'DB');

// Fichero de la base de datos
const dbPath = path.join(dataFolder, 'app.db');

// Creamos la conexión a la base de datos
const db = new database(dbPath);

// Creamos la tabla de usuarios si no existe
try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `).run();
    console.log(`[DB] Loaded 'users' table`);
} catch (err) {
    console.error(`[DB] Error while creating 'users' table: ${err.message}`);
}

// Creamos la tabla de flujos si no existe
try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS streams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT UNIQUE,
            url TEXT NOT NULL,
            codec TEXT DEFAULT '${config.ffmpeg.defaultParams.codec}',
            resolution TEXT DEFAULT '${config.ffmpeg.defaultParams.resolution}',
            framerate TEXT DEFAULT '${config.ffmpeg.defaultParams.framerate}',
            preset TEXT DEFAULT '${config.ffmpeg.defaultParams.preset}',
            bitrate TEXT DEFAULT '${config.ffmpeg.defaultParams.bitrate}',
            recording BOOLEAN DEFAULT 0,
            recordingDuration INTEGER DEFAULT '${config.ffmpeg.recordingParams.duration}',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `).run();
    console.log(`[DB] Loaded 'streams' table`);
} catch (err) {
    console.error(`[DB] Error while creating 'streams' table: ${err.message}`);
}

module.exports = db;