const functions = require("firebase-functions");
const {getFirestore} = require("firebase-admin/firestore");

const db = getFirestore();

exports.getClientesStatus = functions.https.onCall(async (data, context) => {
  const clientesRef = db.collection("Clientes");
  const snapshot = await clientesRef.get();

  let activos = 0;
  let inactivos = 0;

  if (!snapshot.empty) {
    snapshot.forEach((doc) => {
      const cliente = doc.data();
      if (cliente.activo === true) {
        activos += 1;
      } else {
        inactivos += 1;
      }
    });
  }

  return [
    {name: "Activos", value: activos},
    {name: "Inactivos", value: inactivos},
  ];
});
