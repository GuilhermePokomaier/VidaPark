// services/mercadopago.js
//
// Centraliza a URL das Cloud Functions e a chamada HTTP.
// Se você trocar de projeto Firebase de novo no futuro, só precisa
// atualizar essa URL aqui (e o WEBHOOK_URL correspondente no index.js
// do backend) em um único lugar.

const FUNCTIONS_URL = "https://vidapark.onrender.com";

export async function callFunction(name, data) {
  const response = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error.message || "Erro desconhecido");
  }

  return result;
}