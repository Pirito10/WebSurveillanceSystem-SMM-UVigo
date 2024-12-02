const path = require('path');
const fs = require('fs');
const config = require('../../config/default');
const ffmpeg = require('fluent-ffmpeg');

// Mapa para almacenar procesos de FFmpeg por su ID
const ffmpegProcesses = {};

// Ruta estática para el directorio de logs y de salida
const logsFolder = path.resolve(config.paths.logsFolder);
const outputFolder = path.resolve(config.paths.outputFolder);

// Función para lanzar FFmpeg
const startFFmpeg = (id, inputUrl) => {

    // Crear subdirectorio para el ID si no existe
    const streamOutputFolder = path.join(outputFolder, id);
    if (!fs.existsSync(streamOutputFolder)) {
        fs.mkdirSync(streamOutputFolder, { recursive: true });
        console.log(`[FFmpeg - ${id}] Directory created: ${streamOutputFolder}`);
    }

    // Archivo de salida HLS
    const outputFile = path.join(streamOutputFolder, 'output.m3u8');

    // Abrimos el fichero de logs
    const logFilePath = path.join(logsFolder, `${id}.log`);
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Abrir en modo append

    // Reinicia el proceso si ya existía
    if (ffmpegProcesses[id]) {
        console.log(`[FFmpeg - ${id}] Was already running. Stopping...`);
        ffmpegProcesses[id].kill('SIGINT'); // Detener proceso anterior
        delete ffmpegProcesses[id];// Eliminar el proceso del mapa
    }

    // Crear el comando ffmpeg
    const process = ffmpeg(inputUrl)
        .outputOptions([
            ...config.ffmpeg.baseParams, // Parámetros básicos
            ...config.ffmpeg.hlsParams, // Parámetros específicos de HLS
        ])
        .output(outputFile) // Archivo de salida
        .on('start', () => {
            console.log(`[FFmpeg - ${id}] Starting on URL: ${inputUrl}`);
        })
        .on('stderr', (stderrLine) => {
            logStream.write(`${stderrLine}\n`);
        })
        .on('error', (err) => {
            console.log(`[FFmpeg - ${id}] Error: ${err}`);
            delete ffmpegProcesses[id];
        })
        .on('end', () => {
            delete ffmpegProcesses[id];
        });

    // Iniciar el proceso
    process.run();

    // Guardar el proceso en el mapa
    ffmpegProcesses[id] = process;
};

// Función para detener un proceso FFmpeg
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