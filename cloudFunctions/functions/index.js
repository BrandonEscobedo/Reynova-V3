const { chatbotReynova } = require("./chatbotReynova");

const { initializeApp } = require("firebase-admin/app");
const { setGlobalOptions } = require("firebase-functions");

setGlobalOptions({ maxInstances: 10 });

exports.getDashboardData = require("./getDashboardData").getDashboardData;

exports.getClientesStatus = require("./getClientesStatus").getClientesStatus;

exports.procesarRespuestaCliente = require("./procesarRespuestaCliente").procesarRespuestaCliente;

exports.enviarCotizacionPorCorreo = require("./enviarCotizacionPorCorreo").enviarCotizacionPorCorreo;
// Solo exportamos el chatbot para ver si este archivo es el que truena
exports.chatbotReynova = chatbotReynova;
