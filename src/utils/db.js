const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../../config/default'); // Fichero de configuración
const createDirectory = require('../utils/utils'); // Fichero de útiles

// Creamos el directorio para almacenar la base de datos si no existe
const dataFolder = path.resolve(config.paths.dataFolder);
createDirectory(dataFolder, 'DB');

// Fichero de la base de datos
const dbPath = path.join(dataFolder, 'app.db');

// Creamos la conexión a SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB] Error connecting to SQLite:', err.message);
    } else {
        console.log('[DB] Succesfully connected to SQLite');
    }
});

// Creamos las tablas si no existen
db.serialize(() => {
    // Tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error(`[DB] Error while creating 'users' table: ${err.message}`);
        }
    });

    // Tabla de flujos
    db.run(`
        CREATE TABLE IF NOT EXISTS streams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stream_name TEXT NOT NULL,
            stream_url TEXT NOT NULL,
            config TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error(`[DB] Error while creating 'streams' table: ${err.message}`);
        }
    });
});