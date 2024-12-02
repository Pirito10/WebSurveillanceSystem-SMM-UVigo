const fs = require('fs');

// Función que crea un directorio si no existe
const createDirectory = (directoryPath, source = 'Server') => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`[${source}] Directory created: ${directoryPath}`);
    }
};

module.exports = createDirectory;