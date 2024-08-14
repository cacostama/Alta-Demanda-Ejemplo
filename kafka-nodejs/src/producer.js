// src/producer.js
const kafka = require('kafka-node');
const client = new kafka.KafkaClient({ kafkaHost: '127.0.0.1:9092' });
const Producer = kafka.Producer;
const producer = new Producer(client);

producer.on('ready', () => {
  console.log('Productor de Kafka listo');
});

producer.on('error', (err) => {
  console.error('Error en el productor de Kafka:', err);
});

module.exports = producer;
