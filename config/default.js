const path = require('path');

module.exports = {
    server: {
        port: 3000, // Puerto en el que se ejecuta el servidor
        staticFolder: path.resolve(__dirname, '../public'), // Ruta a la carpeta con los archivos estáticos
    },
    paths: {
        outputFolder: path.resolve(__dirname, '../output'), // Ruta a la carpeta para los archivos HLS
        logsFolder: path.resolve(__dirname, '../logs'), // Ruta a la carpeta para los logs de FFmpeg
        dataFolder: path.resolve(__dirname, '../data'), // Ruta a la carpeta para la base de datos
        htmlFiles: {
            login: path.resolve(__dirname, '../public/login.html'), // Ruta al fichero HTML de login
            streams: path.resolve(__dirname, '../public/streams.html'), // Ruta al fichero HTML de flujos
        },
    },
    ffmpeg: {
        baseParams: [
            '-tune', 'zerolatency', // Ajuste para transmisión en vivo
            '-an', // Sin audio
        ],
        customParams: {
            codec: 'libx264', // Codec de video
            resolution: '1280:720', // Resolución de salida
            preset: 'veryfast', // Preset para velocidad/calidad
            bitrate: '1500k', // Tasa de bits del video
        },
        hlsParams: [
            '-f', 'hls', // Formato de salida
            '-hls_time', '1', // Duración de los segmentos
            '-hls_list_size', '10', // Número máximo de segmentos en la lista
            '-hls_flags', 'delete_segments+append_list+split_by_time', // Flags adicionales para HLS
        ],
    },
};
