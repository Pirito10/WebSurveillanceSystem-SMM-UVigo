const express = require('express');
const path = require('path');

const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
