/*const functions = require("firebase-functions");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");

exports.ventasPorProducto = functions.https.onCall(async (data, context) => {
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

  const productos = {};
  snapshot.forEach((doc) => {
    const venta = doc.data();
    const productosVendidos = venta.productosVendidos || [];

    for (const p of productosVendidos) {
      const id = p.productoId;
      if (!productos[id]) {
        productos[id] = {
          nombre: p.nombre || "Sin Nombre",
          vecesVendido: 0,
          montoTotal: 0,
        };
      }
      productos[id].vecesVendido += p.cantidad || 0;
      productos[id].montoTotal += p.subtotal || 0;
    }
  });

  const resultado = Object.keys(productos).map((id) => ({
    id: id,
    nombre: productos[id].nombre,
    vecesVendido: productos[id].vecesVendido,
    montoTotal: productos[id].montoTotal,
  }));

  return resultado
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 10);
});*/
