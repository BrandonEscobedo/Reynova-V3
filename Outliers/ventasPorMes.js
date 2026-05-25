/*const functions = require("firebase-functions");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");

const parseDate = (fechaInput) => {
  if (!fechaInput) return new Date();
  if (fechaInput.toDate) return fechaInput.toDate();
  return new Date(fechaInput);
};

const mesesAbrev = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

exports.ventasPorMes = functions.https.onCall(async (data, context) => {
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

  const meses = {};
  snapshot.forEach((doc) => {
    const venta = doc.data();
    const fecha = parseDate(venta.fecha);
    const mesClave = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1,
    ).padStart(2, "0")}`;

    if (!meses[mesClave]) {
      const mesNombre = mesesAbrev[fecha.getMonth()];
      const anioCorto = String(fecha.getFullYear()).slice(2);
      meses[mesClave] = {
        mesDisplay: `${mesNombre}-${anioCorto}`,
        totalVentas: 0,
        montoTotal: 0,
      };
    }
    meses[mesClave].totalVentas += 1;
    meses[mesClave].montoTotal += venta.montoTotal || 0;
  });

  const resultado = Object.keys(meses).map((mesKey) => ({
    mesSort: mesKey,
    mesDisplay: meses[mesKey].mesDisplay,
    totalVentas: meses[mesKey].totalVentas,
    montoTotal: meses[mesKey].montoTotal,
  }));

  return resultado.sort((a, b) => a.mesSort.localeCompare(b.mesSort));
});*/

