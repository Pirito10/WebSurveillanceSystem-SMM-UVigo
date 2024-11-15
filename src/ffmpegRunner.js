const { spawn } = require('child_process');
const path = require('path');

let ffmpegProcess = null;

const startFFmpeg = (inputUrl, outputFolder) => {
    if (ffmpegProcess) {
        console.log('Deteniendo FFmpeg existente...');
        ffmpegProcess.kill('SIGINT'); // Detener FFmpeg si ya está ejecutándose
    }

    console.log(`Iniciando FFmpeg para ${inputUrl}...`);
    ffmpegProcess = spawn('ffmpeg', [
        '-i', inputUrl,               // URL del flujo de entrada
        '-hls_time', '4',             // Duración de los segmentos HLS
        '-hls_playlist_type', 'event', // Configuración para transmisión continua
        '-f', 'hls',                  // Formato de salida
        path.join(outputFolder, 'output.m3u8') // Archivo HLS de salida
    ]);

    // Captura los logs de FFmpeg
    ffmpegProcess.stderr.on('data', (data) => console.error(`FFmpeg Error: ${data.toString()}`));
    ffmpegProcess.stdout.on('data', (data) => console.log(`FFmpeg: ${data.toString()}`));

    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg terminó con código ${code}`);
        ffmpegProcess = null; // Limpia la referencia
    });

    return ffmpegProcess;
};

const stopFFmpeg = () => {
    if (ffmpegProcess) {
        console.log('Deteniendo FFmpeg...');
        ffmpegProcess.kill('SIGINT');
        ffmpegProcess = null;
    } else {
        console.log('No hay procesos de FFmpeg en ejecución.');
    }
};

module.exports = {
    startFFmpeg,
    stopFFmpeg,
};
