/*const functions = require("firebase-functions");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");

exports.resumenGeneral = functions.https.onCall(async (data, context) => {
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

  if (snapshot.empty) {
    return {totalVentas: 0, montoTotal: 0, promedio: 0};
  }

  let totalVentas = 0;
  let montoTotal = 0;

  snapshot.forEach((doc) => {
    const venta = doc.data();
    totalVentas += 1;
    montoTotal += venta.montoTotal || 0;
  });

  const promedio = totalVentas > 0 ? montoTotal / totalVentas : 0;

  return {totalVentas, montoTotal, promedio};
});
*/
