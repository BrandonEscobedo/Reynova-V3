const functions = require("firebase-functions");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.procesarRespuestaCliente = functions.https.onCall(async (data, context) => {
  
  // 1. Extracción a prueba de balas: 
  // Firebase a veces anida el payload en "data.data" dependiendo de la versión del SDK.
  const payload = data.cotizacionId ? data : (data.data || {});
  const cotizacionId = payload.cotizacionId;
  const nuevoStatus = payload.nuevoStatus;
  const comentarioCliente = payload.comentarioCliente || null;

  // 2. Validaciones iniciales
  if (!cotizacionId || !nuevoStatus) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Faltan parámetros requeridos (cotizacionId, nuevoStatus)."
    );
  }

  if (!["aprobada", "rechazada"].includes(nuevoStatus.toLowerCase())) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Status inválido. Solo se permite 'aprobada' o 'rechazada'."
    );
  }

  const db = getFirestore();
  const cotizacionRef = db.collection("cotizaciones").doc(cotizacionId);

  try {
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(cotizacionRef);

      if (!docSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "La cotización no existe."
        );
      }

      const cotizacionData = docSnap.data();

      if (cotizacionData.status.toLowerCase() !== "pendiente") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Esta cotización ya no está pendiente y no puede ser modificada."
        );
      }

      if (nuevoStatus.toLowerCase() === "aprobada") {
        const productos = cotizacionData.productos || [];

        for (const prod of productos) {
          const productRef = db.collection("productos").doc(prod.productoId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists) {
            throw new functions.https.HttpsError(
              "not-found",
              `El producto ${prod.nombre || prod.productoId} no existe.`
            );
          }

          const stockActual = productSnap.data().stock ?? 0;
          if (stockActual < prod.cantidad) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              `Inventario insuficiente para el producto ${prod.nombre || prod.productoId}. Stock actual: ${stockActual}, Solicitado: ${prod.cantidad}.`
            );
          }

          transaction.update(productRef, {
            stock: FieldValue.increment(-prod.cantidad),
            productosVendidos: FieldValue.increment(prod.cantidad),
          });
        }
      }

      const actualizacion = { status: nuevoStatus };
      if (comentarioCliente) {
        actualizacion.comentariosCliente = comentarioCliente;
      }

      transaction.update(cotizacionRef, actualizacion);
    });

    return { success: true, message: `Cotización ${nuevoStatus} exitosamente.` };
  } catch (error) {
    console.error("Error al procesar la respuesta:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Error al procesar la solicitud.");
  }
});