const kafka = require('kafka-node');
const pool = require('./db');

const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: '127.0.0.1:9092' });
const consumer = new Consumer(client, [{ topic: 'pagos', partition: 0 }], { autoCommit: true });

consumer.on('message', async (message) => {
  try {
    const { cuenta_id, monto, descripcion } = JSON.parse(message.value);

    await pool.query('BEGIN');

    const saldoResult = await pool.query('SELECT saldo_actual FROM saldos WHERE cuenta_id = $1 FOR UPDATE', [cuenta_id]);

    if (saldoResult.rows.length === 0) {
      throw new Error('Cuenta no encontrada');
    }

    const saldoActual = parseFloat(saldoResult.rows[0].saldo_actual);

    if (saldoActual < monto) {
      throw new Error('Saldo insuficiente');
    }

    const nuevoSaldo = saldoActual - monto;

    await pool.query('UPDATE saldos SET saldo_actual = $1, fecha_actualizacion = NOW() WHERE cuenta_id = $2', [nuevoSaldo, cuenta_id]);
    await pool.query('INSERT INTO pagos (cuenta_id, monto, descripcion) VALUES ($1, $2, $3)', [cuenta_id, monto, descripcion]);

    await pool.query('COMMIT');

    console.log(`Pago procesado para la cuenta ${cuenta_id}`);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error procesando el pago:', err.message);

    // Guardar error en la tabla de errores
    await pool.query('INSERT INTO errores_kafka (cuenta_id, error_mensaje) VALUES ($1, $2)', [cuenta_id, err.message]);
  }
});

consumer.on('error', (err) => {
  console.error('Error en el consumidor de Kafka:', err);
});
