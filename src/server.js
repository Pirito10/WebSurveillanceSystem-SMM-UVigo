const express = require('express');
const path = require('path');
const fs = require('fs');
// Fichero de configuración
const config = require('../config/default');
// Fichero de rutas
const routes = require('./routes/routes');

const app = express();
app.use(express.json());

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

// Usamos las rutas definidas en routes.js
app.use(routes);

// Iniciar el servidor
const port = config.server.port;
app.listen(port, () => {
    console.log(`\n[Server] Server running on http://localhost:${port}\n`);
});