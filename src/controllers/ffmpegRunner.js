const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Mapa para almacenar procesos de FFmpeg por su ID
const ffmpegProcesses = {};

// Ruta estática para el directorio de logs
const logsFolder = path.join(__dirname, '../../logs');

/**
 * @param {string} id - ID único para identificar el flujo.
 * @param {string} inputUrl - URL o archivo de entrada.
 * @param {string} outputFolder - Carpeta donde se generarán los archivos HLS.
 * @param {Array<string>} additionalParams - Lista de parámetros personalizados para FFmpeg.
 */
const startFFmpeg = (id, inputUrl, outputFolder, additionalParams = []) => {
    // Crear subdirectorio para el ID si no existe
    const streamOutputFolder = path.join(outputFolder, id);
    if (!fs.existsSync(streamOutputFolder)) {
        fs.mkdirSync(streamOutputFolder, { recursive: true });
        console.log(`[FFmpeg - ${id}] Directory created: ${streamOutputFolder}`);
    }

    // Abrimos el fichero de logs
    const logFilePath = path.join(logsFolder, `${id}.log`);
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Abrir en modo append

    // Reinicia el proceso si ya existía
    if (ffmpegProcesses[id]) {
        console.log(`[FFmpeg - ${id}] Was already running. Stopping...`);
        ffmpegProcesses[id].kill('SIGINT'); // Detener proceso anterior
    }

    console.log(`[FFmpeg - ${id}] Starting on URL: ${inputUrl}`);

    // Creamos la línea de argumentos
    const ffmpegArgs = [
        '-i', inputUrl,
        ...additionalParams,
        '-f', 'hls',
        path.join(outputFolder, `${id}/output.m3u8`),
    ];

    //Ejecutamos el comando (ffmpeg <args>)
    const process = spawn('ffmpeg', ffmpegArgs);

    // Guardar el proceso en el mapa
    ffmpegProcesses[id] = process;

    // Redirigir logs a archivo
    process.stderr.on('data', (data) => logStream.write(`${data.toString()}\n`));

    process.on('close', (code) => {
        console.log(`[FFmpeg - ${id}] Finished with code: ${code}`);
        delete ffmpegProcesses[id]; // Limpia la referencia
    });

    return process;
};

/**
 * Detiene el proceso FFmpeg de un flujo específico.
 * @param {string} id - ID único del flujo.
 */
const stopFFmpeg = (id) => {
    if (ffmpegProcesses[id]) {
        console.log(`[FFmpeg - ${id}] Stopping...`);
        ffmpegProcesses[id].kill('SIGINT');
        delete ffmpegProcesses[id];
    } else {
        console.log(`[FFmpeg - ${id}] Process does not exist`);
    }
};

module.exports = {
    startFFmpeg,
    stopFFmpeg,
};
