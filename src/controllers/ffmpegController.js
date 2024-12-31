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
const startFFmpeg = async (streamName, streamUrl, params = {}) => {
    // Reiniciamos el proceso si ya existía
    if (ffmpegProcesses[streamName]) {
        await stopFFmpeg(streamName);
    }

    // Creamos el subdirectorio para el ID si no existe
    const streamOutputFolder = path.join(outputFolder, streamName);
    createDirectory(streamOutputFolder, `FFmpeg - ${streamName}`);

    // Archivo de salida HLS
    const outputFile = path.join(streamOutputFolder, 'output.m3u8');

    // Abrimos el fichero de logs
    const logFilePath = path.join(logsFolder, `${streamName}.log`);
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Abrir en modo append

    // Obtenemos los parámetros de configuración
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

    // Obtenemos los parámetros de grabación
    const recording = params.recording === 1 ? 'true' : 'false';
    const recordingDuration = params.recordingDuration;
    // Calculamos los segmentos necesarios
    const segmentDuration = config.ffmpeg.keyframeInterval / framerate;
    const segmentsNeeded = Math.ceil(recordingDuration / segmentDuration);
    const recordingParams = recording ? [`-hls_list_size ${segmentsNeeded}`] : config.ffmpeg.recordingParams.disabled;

    // Creamos la lista de parámetros completa
    const allParams = [...config.ffmpeg.baseParams, ...customParams, ...recordingParams, ...config.ffmpeg.hlsParams];

    // Creamos el comando FFmpeg
    const process = ffmpeg(streamUrl)
        .outputOptions(allParams) // Parámetros
        .output(outputFile) // Fichero de salida
        .on('start', () => {
            console.log(`[FFmpeg - ${streamName}] Starting on URL ${streamUrl} with parameters:`);
            console.log(`\tCodec: ${codec}`);
            console.log(`\tResolution: ${resolution}`);
            console.log(`\tFramerate: ${framerate}fps`);
            console.log(`\tPreset: ${preset}`);
            console.log(`\tBitrate: ${bitrate}`);
            console.log(`\tRecording: ${recording}`);
            console.log(`\tDuration: ${recordingDuration}s\n`);
        })
        .on('stderr', (stderrLine) => {
            logStream.write(`${stderrLine}\n`);
        })
        .on('error', (err) => {
            if (err == "Error: ffmpeg was killed with signal SIGINT") {
                console.log(`[FFmpeg - ${streamName}] Stopped`);
            } else {
                console.log(`[FFmpeg - ${streamName}] ${err}`);
                // Eliminamos el proceso del mapa
                delete ffmpegProcesses[streamName];
                // Eliminamos el directorio del flujo
                removeDirectory(path.join(outputFolder, streamName), `FFmpeg - ${streamName}`);
            }
        })
        .on('end', () => {
            // Eliminamos el proceso del mapa
            delete ffmpegProcesses[streamName];
            // Eliminamos el directorio del flujo
            removeDirectory(path.join(outputFolder, streamName), `FFmpeg - ${streamName}`);
        });

    // Iniciamos el proceso
    process.run();

    // Guardamos el proceso en el mapa
    ffmpegProcesses[streamName] = process;
};

// Función para detener un proceso FFmpeg
const stopFFmpeg = (streamName) => {
    // Creamos una promesa
    return new Promise((resolve) => {
        if (ffmpegProcesses[streamName]) {
            // Escuchamos el evento de error para saber que el proceso ha terminado
            ffmpegProcesses[streamName].on('error', () => {
                // Eliminamos el proceso del mapa
                delete ffmpegProcesses[streamName];

                // Eliminamos el directorio del flujo
                removeDirectory(path.join(outputFolder, streamName), `FFmpeg - ${streamName}`);

                // Resolvemos la promesa
                resolve();
            });

            // Enviamos la señal para terminal el proceso
            ffmpegProcesses[streamName].kill('SIGINT');
        } else {
            // Resolvemos la promesa
            resolve();
        }
    });
};

// Función para generar un fichero MP4 a partir de una grabación
const recordStream = async (streamName) => {
    // Creamos una promesa
    return new Promise((resolve, reject) => {
        // Obtenemos el manifiesto de HLS
        const inputFile = path.join(outputFolder, streamName, 'output.m3u8');
        // Creamos el fichero de salida
        const outputFile = path.join(outputFolder, streamName, `output.mp4`);

        // Ejecutamos el comando FFmpeg
        ffmpeg()
            .input(inputFile) // Fichero de entrada
            .outputOptions('-c copy') // Parámetros
            .output(outputFile) // Fichero de salida
            .on('start', () => {
                console.log(`[FFmpeg - ${streamName}] Recording to file ${outputFile}`);
            })
            .on('error', (err) => {
                console.error(`[FFmpeg - ${streamName}] ${err}`);
                reject();
            })
            .on('end', () => {
                console.log(`[FFmpeg - ${streamName}] Recording successful`);
                // Resolvemos la promesa devolviendo el fichero resultante
                resolve(outputFile);
            })
            .run();
    });
};

module.exports = {
    startFFmpeg,
    stopFFmpeg,
    recordStream
};