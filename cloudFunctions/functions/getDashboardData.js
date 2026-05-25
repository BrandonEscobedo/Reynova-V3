const functions = require("firebase-functions");
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

exports.getDashboardData = functions.https.onCall(async (data, context) => {
  const db = getFirestore();
  const cotizacionesRef = db.collection("cotizaciones");
  const clientesRef = db.collection("Clientes");
  const productosRef = db.collection("productos"); // 1. Referencia a tus productos

  let query = cotizacionesRef.where("status", "==", "aprobada");

  // FILTROS DE FECHAS - Valida que ambas fechas tengan valor y no sean strings vacíos
  const payload = data?.fechaInicio && data?.fechaFin ? data : data?.rawRequest?.body?.data || {};
  if (payload?.fechaInicio && payload?.fechaFin && payload.fechaInicio.trim() !== "" && payload.fechaFin.trim() !== "") {
    // Forzamos a que inicie al primer segundo del día
    const startDate = new Date(`${payload.fechaInicio}T00:00:00`);
    const inicio = Timestamp.fromDate(startDate);
    
    // Forzamos a que termine al último segundo del día
    const endDate = new Date(`${payload.fechaFin}T23:59:59`);
    const fin = Timestamp.fromDate(endDate);
    
    query = query.where("createdAt", ">=", inicio);
    query = query.where("createdAt", "<=", fin);
  } else {
    // Sin fechas especificadas = mostrar TODAS las cotizaciones (sin filtro de rango)
    // Si prefieres un rango por defecto, reemplaza este bloque
  }

  // 2. Traemos todo al mismo tiempo: Clientes, Productos y Cotizaciones
  const [clientesSnap, productosSnap, snapshot] = await Promise.all([
    clientesRef.get(),
    productosRef.get(),
    query.get(),
  ]);

  const clientesMap = {};
  clientesSnap.forEach((doc) => {
    const d = doc.data();
    clientesMap[doc.id] = d.nombreEmpresa || d.nombre || "Sin Nombre";
  });

  // 3. EL DICCIONARIO DE COSTOS: Mapeamos idProducto -> costo_adquisicion
  const costosMap = {};
  productosSnap.forEach((doc) => {
    const p = doc.data();
    costosMap[doc.id] = Number(p.costo_adquisicion || 0);
  });

  // Agregamos 'utilidadNeta' al resumen general
  const resumen = {totalVentas: 0, montoTotal: 0, ticketPromedio: 0, utilidadNeta: 0};
  const ventasMes = {};
  const ventasDia = {};
  const clientesData = {};
  const metodosData = {};
  const prodCant = {};
  const prodIngreso = {};
  const catData = {};
  const modData = {};

  snapshot.forEach((doc) => {
    const c = doc.data();
    const monto = Number(c.total || 0);
    const fecha = parseDate(c.createdAt);

    resumen.totalVentas += 1;
    resumen.montoTotal += monto;

    // Recorremos los productos vendidos en esta cotización
    let costoTotalCotizacion = 0; 

    if (c.productos && Array.isArray(c.productos)) {
      c.productos.forEach((prod) => {
        const pId = prod.productoId;
        const pName = prod.nombre || "Sin nombre";
        const cat = prod.categoria || "General";
        const mod = prod.modelo || "Sin modelo";
        const cant = Number(prod.cantidad || 1);
        const sub = Number(prod.subtotal || 0);
        
        // Buscamos cuánto nos costó y lo multiplicamos por la cantidad vendida
        const costoUnitario = costosMap[pId] || 0;
        costoTotalCotizacion += (costoUnitario * cant);

        if (!prodCant[pName]) prodCant[pName] = {nombre: pName, valor: 0};
        prodCant[pName].valor += cant;

        if (!prodIngreso[pName]) {
          prodIngreso[pName] = {nombre: pName, valor: 0};
        }
        prodIngreso[pName].valor += sub;

        if (!catData[cat]) catData[cat] = {nombre: cat, valor: 0};
        catData[cat].valor += sub;

        if (!modData[mod]) modData[mod] = {nombre: mod, valor: 0};
        modData[mod].valor += cant;
      });
    }

    // 4. Calculamos la utilidad de esta venta individual
    const utilidad = monto - costoTotalCotizacion;
    resumen.utilidadNeta += utilidad; // Lo sumamos al general

    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const mesKey = `${fecha.getFullYear()}-${mm}`;
    if (!ventasMes[mesKey]) {
      const mIndex = fecha.getMonth();
      const mName = mesesAbrev[mIndex];
      const yShort = String(fecha.getFullYear()).slice(2);
      ventasMes[mesKey] = {
        mesSort: mesKey,
        mesDisplay: `${mName}-${yShort}`,
        montoTotal: 0,
        utilidadNeta: 0 // Nuevo campo para la gráfica
      };
    }
    ventasMes[mesKey].montoTotal += monto;
    ventasMes[mesKey].utilidadNeta += utilidad; // Sumamos la utilidad a su mes

    const diaKey = fecha.toISOString().split("T")[0];
    if (!ventasDia[diaKey]) {
      ventasDia[diaKey] = {fecha: diaKey, montoTotal: 0, utilidadNeta: 0};
    }
    ventasDia[diaKey].montoTotal += monto;
    ventasDia[diaKey].utilidadNeta += utilidad;

    const cId = c.clienteId || "Desconocido";
    const nombreReal = clientesMap[cId] || "Cliente no encontrado";
    if (!clientesData[cId]) {
      clientesData[cId] = {nombre: nombreReal, montoAcumulado: 0};
    }
    clientesData[cId].montoAcumulado += monto;

    const metodo = c.metodoPago || "No especificado";
    if (!metodosData[metodo]) {
      metodosData[metodo] = {name: metodo, value: 0};
    }
    metodosData[metodo].value += 1;
  });

  if (resumen.totalVentas > 0) {
    resumen.ticketPromedio = resumen.montoTotal / resumen.totalVentas;
  }

  const sortMonto = (a, b) => b.montoAcumulado - a.montoAcumulado;
  const sortValor = (a, b) => b.valor - a.valor;

  return {
    resumenGeneral: resumen,
    ventasPorMes: Object.values(ventasMes)
        .sort((a, b) => a.mesSort.localeCompare(b.mesSort)),
    ventasPorDia: Object.values(ventasDia)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    ventasPorCliente: Object.values(clientesData)
        .sort(sortMonto).slice(0, 10),
    graficaMetodosPago: Object.values(metodosData),
    topProductosCant: Object.values(prodCant)
        .sort(sortValor).slice(0, 10),
    topProductosIngreso: Object.values(prodIngreso)
        .sort(sortValor).slice(0, 10),
    ventasPorCategoria: Object.values(catData).sort(sortValor),
    topModelos: Object.values(modData).sort(sortValor).slice(0, 10),
  };
});