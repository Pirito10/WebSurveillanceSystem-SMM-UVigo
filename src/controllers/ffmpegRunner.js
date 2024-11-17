const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../../config/default');

// Mapa para almacenar procesos de FFmpeg por su ID
const ffmpegProcesses = {};

// Ruta estática para el directorio de logs y de salida
const logsFolder = path.resolve(config.paths.logsFolder);
const outputFolder = path.resolve(config.paths.outputFolder);

// Función para construír el parámetro de ejecución de FFmpeg
const buildFfmpegParams = (id, inputUrl) => {

    // Crear subdirectorio para el ID si no existe
    const streamOutputFolder = path.join(outputFolder, id);
    if (!fs.existsSync(streamOutputFolder)) {
        fs.mkdirSync(streamOutputFolder, { recursive: true });
        console.log(`[FFmpeg - ${id}] Directory created: ${streamOutputFolder}`);
    }

    // Obtenemos las configuraciones y la ruta al fichero de salida
    const ffmpegConfig = config.ffmpeg;
    const outputFile = path.join(streamOutputFolder, 'output.m3u8'); // Archivo de salida HLS

    return [
        '-i', inputUrl, // URL de entrada
        ...ffmpegConfig.baseParams, // Parámetros básicos
        ...ffmpegConfig.hlsParams, // Parámetros específicos de HLS
        outputFile, // Archivo de salida
    ];
};

// Función para lanzar FFmpeg
const startFFmpeg = (id, inputUrl) => {

    // Abrimos el fichero de logs
    const logFilePath = path.join(logsFolder, `${id}.log`);
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Abrir en modo append

    // Reinicia el proceso si ya existía
    if (ffmpegProcesses[id]) {
        console.log(`[FFmpeg - ${id}] Was already running. Stopping...`);
        ffmpegProcesses[id].kill('SIGINT'); // Detener proceso anterior
    }

    console.log(`[FFmpeg - ${id}] Starting on URL: ${inputUrl}`);

    // Obtenemos un string con los parámetros
    const ffmpegArgs = buildFfmpegParams(id, inputUrl);
    // Ejecutamos el comando (ffmpeg <args>)
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

// Función para detener FFmpeg
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
