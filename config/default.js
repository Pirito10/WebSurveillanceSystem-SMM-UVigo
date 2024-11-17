module.exports = {
    server: {
        port: 3000, // Puerto en el que se ejecuta el servidor
        staticFolder: './public', // Carpeta para los archivos estáticos
    },
    paths: {
        outputFolder: './output', // Carpeta base para los archivos HLS
        logsFolder: './logs', // Carpeta para los logs de FFmpeg
    },
    ffmpeg: {
        hlsTime: 4, // Duración de los segmentos HLS en segundos
        hlsPlaylistType: 'event', // Tipo de lista de reproducción HLS (event, vod, live)
    },
};
