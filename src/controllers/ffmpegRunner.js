const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpegProcesses = {}; // Mapa para almacenar procesos de FFmpeg por ID

// Ruta estática para el directorio de logs en la raíz del proyecto
const logsFolder = path.join(__dirname, '../../logs');

// Asegurarse de que el directorio de logs exista
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder, { recursive: true });
    console.log(`Directorio de logs creado: ${logsFolder}`);
}

/**
 * Inicia un proceso FFmpeg para un flujo específico.
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
        console.log(`Directorio creado: ${streamOutputFolder}`);
    }

    const logFilePath = path.join(logsFolder, `${id}.log`);
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Abrir en modo append

    //Reinicia el proceso si ya existía
    if (ffmpegProcesses[id]) {
        console.log(`FFmpeg ya está corriendo para el ID: ${id}. Deteniéndolo...`);
        ffmpegProcesses[id].kill('SIGINT'); // Detener proceso anterior
    }

    console.log(`Iniciando FFmpeg para ID: ${id}, URL: ${inputUrl}...`);

    //Creamos la línea de argumentos
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
    process.stderr.on('data', (data) => logStream.write(`[${id}] FFmpeg Error: ${data.toString()}\n`));
    process.stdout.on('data', (data) => logStream.write(`[${id}] FFmpeg Log: ${data.toString()}\n`));

    process.on('close', (code) => {
        console.log(`[${id}] FFmpeg terminó con código ${code}`);
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
        console.log(`Deteniendo FFmpeg para ID: ${id}...`);
        ffmpegProcesses[id].kill('SIGINT');
        delete ffmpegProcesses[id];
    } else {
        console.log(`No hay procesos de FFmpeg corriendo para ID: ${id}.`);
    }
};

module.exports = {
    startFFmpeg,
    stopFFmpeg,
};
