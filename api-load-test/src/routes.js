const express = require('express');
const pool = require('./db');
const router = express.Router();

// Ruta para consultar el saldo de una cuenta
router.get('/cuentas/:id/saldo', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM saldos WHERE cuenta_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Función para registrar errores en la base de datos
async function registrarError(cuenta_id, mensaje_error) {
  await pool.query(
    'INSERT INTO errores_kafka (cuenta_id, mensaje_error) VALUES ($1, $2)',
    [cuenta_id, mensaje_error]
  );
}

// Ruta para realizar un pago desde una cuenta
router.post('/cuentas/:id/pago', async (req, res) => {
  try {
    const { id } = req.params; // Captura el id de la cuenta desde los parámetros
    const { monto, descripcion } = req.body;

    await pool.query('BEGIN');

    // Obtiene el saldo con un bloqueo exclusivo
    const saldoResult = await pool.query('SELECT saldo_actual FROM saldos WHERE cuenta_id = $1 FOR UPDATE', [id]);

    if (saldoResult.rows.length === 0) {
      throw new Error('Cuenta no encontrada');
    }

    const saldoActual = parseFloat(saldoResult.rows[0].saldo_actual);

    if (saldoActual < monto) {
      throw new Error('Saldo insuficiente');
    }

    const nuevoSaldo = saldoActual - monto;

    // Simula una operación prolongada para generar bloqueos
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos de retraso

    await pool.query('UPDATE saldos SET saldo_actual = $1, fecha_actualizacion = NOW() WHERE cuenta_id = $2', [nuevoSaldo, id]);
    await pool.query('INSERT INTO pagos (cuenta_id, monto, descripcion) VALUES ($1, $2, $3)', [id, monto, descripcion]);

    await pool.query('COMMIT');

    res.json({ message: 'Pago realizado exitosamente', nuevoSaldo });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);

    // Registrar el error en la base de datos usando el id de la cuenta
    const { id } = req.params; // Utiliza el id de la cuenta desde los parámetros de la solicitud
    await registrarError(id, err.message);

    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
