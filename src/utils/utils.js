const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

// Función que crea un directorio si no existe
const createDirectory = (directoryPath, source = 'Server') => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`[${source}] Directory created: ${directoryPath}`);
    }
};

// Promisificamos scrypt para usar async/await
const scrypt = util.promisify(crypto.scrypt);

// Función que hashea una contraseña
async function hashPassword(password) {
    // Generamos un salt único
    const salt = crypto.randomBytes(16).toString('hex');
    // Hasheamos la contraseña con el salt
    const hashedPassword = await scrypt(password, salt, 64);
    // Devolvemos el resultado en formato salt:hash
    return `${salt}:${hashedPassword.toString('hex')}`;
}

// Función que verifica una contraseña
async function verifyPassword(password, storedHash) {
    // Separamos el salt y el hash
    const [salt, key] = storedHash.split(':');
    // Hasheamos la contraseña que queremos verificar
    const hashedBuffer = await scrypt(password, salt, 64);
    // Comparamos ambos hashes
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), hashedBuffer);
}

module.exports = {
    createDirectory,
    hashPassword,
    verifyPassword,
};