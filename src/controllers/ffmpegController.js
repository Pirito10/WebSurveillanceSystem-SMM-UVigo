const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../../config/default'); // Fichero de configuración
const { createDirectory, removeDirectory } = require('../utils/utils'); // Fichero de útiles

// Mapa para almacenar procesos de FFmpeg por su ID
const ffmpegProcesses = {};

// Ruta estática para el directorio de logs y de salida
const logsFolder = path.resolve(config.paths.logsFolder);
const outputFolder = path.resolve(config.paths.outputFolder);

// Función para lanzar FFmpeg
const startFFmpeg = async (id, inputUrl, params = {}) => {
    // Reiniciamos el proceso si ya existía
    if (ffmpegProcesses[id]) {
        await stopFFmpeg(id);
    }

    // Creamos el subdirectorio para el ID si no existe
    const streamOutputFolder = path.join(outputFolder, id);
    createDirectory(streamOutputFolder, `FFmpeg - ${id}`);

    // Archivo de salida HLS
    const outputFile = path.join(streamOutputFolder, 'output.m3u8');

    // Abrimos el fichero de logs
    const logFilePath = path.join(logsFolder, `${id}.log`);
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Abrir en modo append

    // Obtenemos los parámetros configurables
    const codec = params.codec;
    const resolution = params.resolution;
    const framerate = params.framerate;
    const preset = params.preset;
    const bitrate = params.bitrate;
    const maxrate = `${parseInt(bitrate) * 2}k`;
    const bufsize = `${parseInt(maxrate) * 2}k`;
    const customParams = [
        '-c:v', codec,
        '-vf', `scale=${resolution}`,
        '-r', framerate,
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
            console.log(`\tFramerate: ${framerate}`);
            console.log(`\tPreset: ${preset}`);
            console.log(`\tBitrate: ${bitrate}\n`);
        })
        .on('stderr', (stderrLine) => {
            logStream.write(`${stderrLine}\n`);
        })
        .on('error', (err) => {
            if (err == "Error: ffmpeg was killed with signal SIGINT") {
                console.log(`[FFmpeg - ${id}] Stopped`);
            } else {
                console.log(`[FFmpeg - ${id}] ${err}\n`);
                stopFFmpeg(id);
            }
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
    // Creamos una promesa
    return new Promise((resolve) => {
        // Escuchamos el evento de error para saber que el proceso ha terminado
        ffmpegProcesses[id].on('error', () => {
            // Eliminamos el proceso del mapa
            delete ffmpegProcesses[id];

            // Eliminamos el directorio del flujo
            removeDirectory(path.join(outputFolder, id), `FFmpeg - ${id}`);

            // Resolvemos la promesa
            resolve();
        });

        // Enviamos la señal para terminal el proceso
        ffmpegProcesses[id].kill('SIGINT');
    })
};

module.exports = {
    startFFmpeg,
    stopFFmpeg
};