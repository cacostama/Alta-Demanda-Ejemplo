const kafka = require('kafka-node');
const Producer = kafka.Producer;
const client = new kafka.KafkaClient({ kafkaHost: '127.0.0.1:9092' });
const producer = new Producer(client);

function enviarPagoKafka(cuentaId, monto, descripcion) {
  const payloads = [
    {
      topic: 'pagos',
      messages: JSON.stringify({ cuenta_id: cuentaId, monto, descripcion }),
      partition: 0,
    },
  ];

  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Error enviando el mensaje a Kafka:', err);
    } else {
      console.log(`Mensaje enviado a Kafka: Cuenta ${cuentaId}, Monto ${monto}`);
    }
  });
}

producer.on('ready', async () => {
  console.log('El productor de Kafka está listo');

  const cuentas = [6, 7, 8, 9, 10]; // IDs de cuentas que vas a usar para la prueba
  const monto = 1;

  while (true) {
    for (const cuentaId of cuentas) {
      enviarPagoKafka(cuentaId, monto, 'Pago de prueba con Kafka');
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeño retraso para no saturar
  }
});

producer.on('error', (err) => {
  console.error('Error en el productor de Kafka:', err);
});
