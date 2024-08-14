const express = require('express');
const routes = require('./routes'); // Asegúrate de que './routes' exporta una función de middleware, no un objeto

const app = express();

app.use(express.json()); // Middleware para parsear JSON

app.use('/api', routes); // Aquí se debe pasar el middleware de rutas, que es una función

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
