/*const functions = require("firebase-functions");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");

exports.ventasPorCliente = functions.https.onCall(async (data, context) => {
  const db = getFirestore();
  const ventasRef = db.collection("ventas");
  let query = ventasRef;

  if (data && data.fechaInicio && data.fechaFin) {
    const fechaInicio = Timestamp.fromDate(new Date(data.fechaInicio));
    const fechaFin = Timestamp.fromDate(new Date(data.fechaFin));
    query = query
        .where("fecha", ">=", fechaInicio)
        .where("fecha", "<=", fechaFin);
  } else {
    const hoy = new Date();
    const inicioAnio = Timestamp.fromDate(new Date(hoy.getFullYear(), 0, 1));
    const finAnio = Timestamp.fromDate(new Date(hoy.getFullYear(), 11, 31));
    query = query
        .where("fecha", ">=", inicioAnio)
        .where("fecha", "<=", finAnio);
  }

  const snapshot = await query.get();
  const clientes = {};

  for (const doc of snapshot.docs) {
    const venta = doc.data();
    const clienteId = venta.clienteId;
    let clienteNombre = "Cliente Genérico"; // Nombre por defecto

    if (clienteId) {
      try {
        const clienteDoc = await db.collection("Clientes").doc(clienteId).get();

        if (clienteDoc.exists) {
          clienteNombre = clienteDoc.data().nombre || "Cliente (Sin Nombre)";
        } else {
          clienteNombre = "Cliente (ID No Encontrado)";
        }
      } catch (err) {
        console.error("Error buscando cliente:", err);
        clienteNombre = "Cliente (Error de Búsqueda)";
      }
    }

    const idParaUsar = clienteId || "CLIENTE_GENERICO";

    if (!clientes[idParaUsar]) {
      clientes[idParaUsar] = {
        nombre: clienteNombre,
        totalCompras: 0,
        montoAcumulado: 0,
      };
    }

    clientes[idParaUsar].totalCompras += 1;
    clientes[idParaUsar].montoAcumulado += venta.montoTotal || 0;
  }

  const resultado = Object.keys(clientes).map((id) => ({
    id: id,
    nombre: clientes[id].nombre,
    totalCompras: clientes[id].totalCompras,
    montoAcumulado: clientes[id].montoAcumulado,
  }));

  return resultado.sort((a, b) => b.montoAcumulado - a.montoAcumulado);
});
*/
