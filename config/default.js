module.exports = {
    server: {
        port: 3000, // Puerto en el que se ejecuta el servidor
        staticFolder: './public', // Carpeta para los archivos estáticos
    },
    paths: {
        outputFolder: './output', // Carpeta base para los archivos HLS
        logsFolder: './logs', // Carpeta para los logs de FFmpeg
        dataFolder: './data', // Carpeta para la base de datos
    },
    ffmpeg: {
        baseParams: [
            '-c:v', 'libx264', // Codec de video
            '-preset', 'veryfast', // Preset para velocidad/calidad
            '-tune', 'zerolatency', // Ajuste para transmisión en vivo
            '-b:v', '1500k', // Tasa de bits del video
            '-maxrate', '1500k', // Tasa máxima de bits
            '-bufsize', '3000k', // Tamaño del buffer
            '-vf', 'scale=1280:720', // Resolución de salida
            '-an', // Sin audio
        ],
        hlsParams: [
            '-f', 'hls', // Formato de salida
            '-hls_time', '1', // Duración de los segmentos
            '-hls_list_size', '3', // Número máximo de segmentos en la lista
            '-hls_flags', 'delete_segments+append_list+split_by_time', // Flags adicionales para HLS
        ],
    },
};
