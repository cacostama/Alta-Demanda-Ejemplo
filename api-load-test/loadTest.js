const axios = require('axios');

async function realizarPago(idCuenta, monto) {
  try {
    const response = await axios.post(`http://localhost:3000/api/cuentas/${idCuenta}/pago`, {
      monto: monto,
      descripcion: 'Pago de prueba'
    });
    console.log(`Pago realizado en la cuenta ${idCuenta}:`, response.data);
  } catch (error) {
    console.error(`Error en la cuenta ${idCuenta}:`, error.response ? error.response.data : error.message);
  }
}

(async () => {
  const cuentas = [6, 7, 8, 9, 10]; // IDs de cuentas que vas a usar para la prueba
  const monto = 10;

  while (true) {
    const cuentaAleatoria = cuentas[Math.floor(Math.random() * cuentas.length)];
    realizarPago(cuentaAleatoria, monto);
    await new Promise(resolve => setTimeout(resolve, 50)); // Pequeño retraso para no saturar
  }
})();
