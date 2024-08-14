const express = require('express');
const kafka = require('./producer'); // Reutiliza el productor que ya tienes configurado

const router = express.Router();

router.post('/api/cuentas/:cuentaId/pago', async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { monto, descripcion } = req.body;

    // Asegúrate de que todos los campos están presentes
    if (monto === undefined || descripcion === undefined) {
      return res.status(400).json({ error: 'Monto y descripción son obligatorios' });
    }

    const mensaje = {
      cuenta_id: cuentaId,
      monto,
      descripcion,
    };

    kafka.send([{ topic: 'pagos', messages: JSON.stringify(mensaje) }], (err, data) => {
      if (err) {
        console.error('Error enviando el mensaje a Kafka:', err);
        return res.status(500).json({ error: 'Error enviando el mensaje a Kafka' });
      }
      console.log('Mensaje enviado a Kafka:', data);
      res.status(200).json({ message: 'Pago procesado exitosamente' });
    });

  } catch (error) {
    console.error('Error en /pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
