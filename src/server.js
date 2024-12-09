const express = require('express');
const path = require('path');
const config = require('../config/default'); // Fichero de configuración
const routes = require('./routes/routes'); // Fichero de rutas
const { createDirectory } = require('./utils/utils'); // Fichero de útiles

const app = express();
app.use(express.json());

// Crear los directorios necesarios
const baseOutputFolder = path.resolve(config.paths.outputFolder); // Directorio output (para los flujos de vídeo)
const logsFolder = path.resolve(config.paths.logsFolder); // Directorio de logs
createDirectory(baseOutputFolder);
createDirectory(logsFolder);

// Configuración de la carpeta pública (html, css...)
const staticFolder = path.resolve(config.server.staticFolder);
app.use(express.static(staticFolder));

// Usamos las rutas definidas en routes.js
app.use(routes);

// Iniciar el servidor
const port = config.server.port;
app.listen(port, () => {
    console.log(`\n[Server] Running on http://localhost:${port}\n`);
});