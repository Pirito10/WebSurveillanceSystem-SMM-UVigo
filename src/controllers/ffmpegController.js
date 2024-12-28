const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../../config/default'); // Fichero de configuración
const { createDirectory } = require('../utils/utils'); // Fichero de útiles

// Mapa para almacenar procesos de FFmpeg por su ID
const ffmpegProcesses = {};

// Ruta estática para el directorio de logs y de salida
const logsFolder = path.resolve(config.paths.logsFolder);
const outputFolder = path.resolve(config.paths.outputFolder);

// Función para lanzar FFmpeg
const startFFmpeg = (id, inputUrl, params = {}) => {

    // Creamos el subdirectorio para el ID si no existe
    const streamOutputFolder = path.join(outputFolder, id);
    createDirectory(streamOutputFolder, `FFmpeg - ${id}`);

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

    // Obtenemos los parámetros configurables
    const codec = params.codec || config.ffmpeg.customParams.codec;
    const resolution = params.resolution || config.ffmpeg.customParams.resolution;
    const preset = params.preset || config.ffmpeg.customParams.preset;
    const bitrate = params.bitrate || config.ffmpeg.customParams.bitrate;
    const maxrate = `${parseInt(bitrate) * 2}k`;
    const bufsize = `${parseInt(maxrate) * 2}k`;
    const customParams = [
        '-c:v', codec,
        '-vf', `scale=${resolution}`,
        '-preset', preset,
        '-b:v', bitrate,
        '-maxrate', maxrate,
        '-bufsize', bufsize,
    ];

    // Creamos la lista de parámetros completa
    const allParams = [...config.ffmpeg.baseParams, ...customParams, ...config.ffmpeg.hlsParams];

    // Creamos el comando ffmpeg
    const process = ffmpeg(inputUrl)
        .outputOptions(allParams) // Parámetros
        .output(outputFile) // Fichero de salida
        .on('start', () => {
            console.log(`[FFmpeg - ${id}] Starting on URL ${inputUrl} with parameters:`);
            console.log(`\tCodec: ${codec}`);
            console.log(`\tResolution: ${resolution}`);
            console.log(`\tFramerate: ${params.framerate || 'Default'}`);
            console.log(`\tPreset: ${preset}`);
            console.log(`\tBitrate: ${bitrate}`);
        })
        .on('stderr', (stderrLine) => {
            logStream.write(`${stderrLine}\n`);
        })
        .on('error', (err) => {
            console.log(`[FFmpeg - ${id}] ${err}`);
            delete ffmpegProcesses[id];
        })
        .on('end', () => {
            delete ffmpegProcesses[id];
        });

    // Iniciamos el proceso
    process.run();

    // Guardamos el proceso en el mapa
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

module.exports = startFFmpeg;