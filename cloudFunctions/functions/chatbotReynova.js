const {onCall} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {initializeApp, getApps} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const PRODUCTS_COLLECTION = "productos";
const COTIZACIONES_COLLECTION = "cotizaciones";
const CLIENTES_COLLECTION = "Clientes";

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

const normalizeText = (value = "") =>
  String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

const cleanTerms = (input = "") => {
  const raw = normalizeText(input)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

  const stopwords = new Set([
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas",
    "para", "por", "con", "sin", "que", "como", "cuanto", "cual",
    "donde", "cuando", "del", "al", "y", "o", "u", "es", "en",
    "me", "dime", "quiero", "necesito", "hay", "tienen", "tiene",
    "producto", "productos", "precio", "stock", "modelo", "categoria",
  ]);

  const filtered = raw.filter(
      (term) => term.length >= 2 && !stopwords.has(term),
  );
  return [...new Set(filtered)];
};

// ---------------------------------------------------------------------------
// Utilidades de datos
// ---------------------------------------------------------------------------

const toSafeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const uniqueById = (docs) => {
  const map = new Map();
  docs.forEach((docSnap) => {
    map.set(docSnap.id, docSnap);
  });
  return [...map.values()];
};

const mapProduct = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    nombre: data.nombre || "Sin nombre",
    categoria: data.categoria || "Sin categoria",
    modelo: data.modelo || "Sin modelo",
    precio: toSafeNumber(data.precio),
    stock: toSafeNumber(data.stock),
    productosVendidos: toSafeNumber(data.productosVendidos),
    costo_adquisicion: toSafeNumber(data.costo_adquisicion),
  };
};

const productMatchesQuestion = (product, normalizedQuestion, terms) => {
  const haystack = normalizeText([
    product.nombre,
    product.categoria,
    product.modelo,
  ].join(" "));

  if (normalizedQuestion && haystack.includes(normalizedQuestion)) {
    return true;
  }

  return terms.some((term) => haystack.includes(term));
};

// ---------------------------------------------------------------------------
// Búsqueda de productos (comportamiento original)
// ---------------------------------------------------------------------------

const queryProductsByPrefix = async (field, term, limitCount = 5) => {
  if (!term) return [];
  const snapshot = await db
      .collection(PRODUCTS_COLLECTION)
      .where(field, ">=", term)
      .where(field, "<=", `${term}\uf8ff`)
      .orderBy(field)
      .limit(limitCount)
      .get();
  return snapshot.docs;
};

const queryProductsByKeywords = async (terms, limitCount = 5) => {
  if (!terms.length) return [];
  const subset = terms.slice(0, 10);
  const snapshot = await db
      .collection(PRODUCTS_COLLECTION)
      .where("keywords", "array-contains-any", subset)
      .limit(limitCount)
      .get();
  return snapshot.docs;
};

const fetchRelevantProducts = async (question) => {
  const normalizedQuestion = normalizeText(question);
  const terms = cleanTerms(question);
  const primaryTerm = terms[0] ||
    normalizedQuestion.split(/\s+/).find(Boolean) || "";

  const [nameDocs, modelDocs, categoryDocs, keywordDocs] =
    await Promise.all([
      queryProductsByPrefix("nombre_normalizado", primaryTerm, 8),
      queryProductsByPrefix("modelo_normalizado", primaryTerm, 5),
      queryProductsByPrefix("categoria_normalizada", primaryTerm, 5),
      queryProductsByKeywords(terms, 8),
    ]);

  let docs = uniqueById([
    ...nameDocs,
    ...modelDocs,
    ...categoryDocs,
    ...keywordDocs,
  ]);

  if (!docs.length) {
    const fallbackSnap = await db
        .collection(PRODUCTS_COLLECTION)
        .limit(60)
        .get();

    const filtered = fallbackSnap.docs.filter((docSnap) => {
      const product = mapProduct(docSnap);
      return productMatchesQuestion(product, normalizedQuestion, terms);
    });

    docs = uniqueById(filtered);
  }

  return docs.slice(0, 10).map(mapProduct);
};

// ---------------------------------------------------------------------------
// Detección de intención
// ---------------------------------------------------------------------------

const detectQueryIntent = (question) => {
  const q = normalizeText(question);

  // Negocio: utilidad neta, ganancias, resumen
  if (/utilidad\s*neta|ganancia|rentabilidad|margen|resumen/i.test(q) ||
      /dashboard|panorama|general|total\s*ventas?/i.test(q) ||
      /ingresos?\s*totales?|ticket\s*promedio/i.test(q)) {
    return "business_analytics";
  }

  // Cotizaciones pendientes
  if (/cotizaci[oó]n(es)?\s*pendientes?/i.test(q) ||
      /pendientes?\s*(de|por)\s*(aprobar|revisar|responder)/i.test(q) ||
      /sin\s*aprobar|no\s*aprobad/i.test(q)) {
    return "business_analytics";
  }

  // Clientes activos/inactivos
  if (/clientes?\s*(activos?|inactivos?|totales?)/i.test(q) ||
      /cu[aá]ntos\s*clientes/i.test(q)) {
    return "business_analytics";
  }

  // Analítica de productos
  if (/m[aá]s\s*(barato|caro|vendido|popular)/i.test(q) ||
      /m[aá]s\s*(econ[oó]mico|costoso)/i.test(q) ||
      /bajo\s*stock|sin\s*stock|agotado|top\s*ventas/i.test(q) ||
      /productos?\s*(con|de)\s*(bajo|poco)\s*stock/i.test(q) ||
      /menor\s*precio|mayor\s*precio|ordenar|listar\s*todos/i.test(q)) {
    return "product_analytics";
  }

  return "product_specific";
};

// ---------------------------------------------------------------------------
// Recolección de datos para analítica
// ---------------------------------------------------------------------------

const fetchAllProducts = async (limitCount = 500) => {
  const snapshot = await db
      .collection(PRODUCTS_COLLECTION)
      .limit(limitCount)
      .get();
  return snapshot.docs.map(mapProduct);
};

const fetchCotizacionesByStatus = async (status, limitCount = 200) => {
  const snapshot = await db
      .collection(COTIZACIONES_COLLECTION)
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();
  return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
};

const fetchClientesMap = async () => {
  const snapshot = await db.collection(CLIENTES_COLLECTION).get();
  const map = {};
  snapshot.forEach((doc) => {
    const d = doc.data();
    map[doc.id] = {
      nombre: d.nombreEmpresa || d.nombre || "Sin Nombre",
      activo: d.activo === true,
    };
  });
  return map;
};

// ---------------------------------------------------------------------------
// Cálculo de analíticas
// ---------------------------------------------------------------------------

const computeProductAnalytics = (products) => {
  const cheapest = [...products]
      .filter((p) => p.precio > 0)
      .sort((a, b) => a.precio - b.precio)
      .slice(0, 10);

  const mostExpensive = [...products]
      .filter((p) => p.precio > 0)
      .sort((a, b) => b.precio - a.precio)
      .slice(0, 10);

  const lowStock = [...products]
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock);

  const outOfStock = products.filter((p) => p.stock === 0);

  const bestSellers = [...products]
      .filter((p) => p.productosVendidos > 0)
      .sort((a, b) => b.productosVendidos - a.productosVendidos)
      .slice(0, 10);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const avgPrice = totalProducts > 0 ?
    products.reduce((sum, p) => sum + p.precio, 0) / totalProducts :
    0;

  const categorias = {};
  products.forEach((p) => {
    const cat = p.categoria || "Sin categoria";
    if (!categorias[cat]) {
      categorias[cat] = {nombre: cat, cantidad: 0, stockTotal: 0};
    }
    categorias[cat].cantidad += 1;
    categorias[cat].stockTotal += p.stock;
  });

  return {
    cheapest,
    mostExpensive,
    lowStock,
    outOfStock,
    bestSellers,
    summary: {totalProducts, totalStock, avgPrice},
    categorias: Object.values(categorias)
        .sort((a, b) => b.cantidad - a.cantidad),
    todosLosProductos: products,
  };
};

const computeBusinessAnalytics = (
    approvedQuotes, pendingQuotes, products, clientesMap) => {
  const costosMap = {};
  products.forEach((p) => {
    costosMap[p.id] = p.costo_adquisicion;
  });

  let totalVentasAprobadas = 0;
  let montoTotal = 0;
  let utilidadNeta = 0;

  const ventasPorDia = {};
  const ventasPorCliente = {};

  approvedQuotes.forEach((c) => {
    const monto = Number(c.total || 0);
    totalVentasAprobadas += 1;
    montoTotal += monto;

    let costoTotalCotizacion = 0;
    if (c.productos && Array.isArray(c.productos)) {
      c.productos.forEach((prod) => {
        const costoUnit = costosMap[prod.productoId] || 0;
        costoTotalCotizacion += costoUnit * Number(prod.cantidad || 1);
      });
    }
    const utilidadCotizacion = monto - costoTotalCotizacion;
    utilidadNeta += utilidadCotizacion;

    // Ventas por día
    if (c.createdAt && c.createdAt._seconds) {
      const diaKey = new Date(c.createdAt._seconds * 1000)
          .toISOString()
          .split("T")[0];
      if (!ventasPorDia[diaKey]) {
        ventasPorDia[diaKey] = {
          fecha: diaKey, monto: 0, utilidad: 0, cantidad: 0,
        };
      }
      ventasPorDia[diaKey].monto += monto;
      ventasPorDia[diaKey].utilidad += utilidadCotizacion;
      ventasPorDia[diaKey].cantidad += 1;
    }

    // Ventas por cliente
    const cId = c.clienteId || "Desconocido";
    if (!ventasPorCliente[cId]) {
      const nombreCli = clientesMap[cId] ?
        clientesMap[cId].nombre : "Desconocido";
      ventasPorCliente[cId] = {
        cliente: nombreCli,
        monto: 0,
        cantidad: 0,
      };
    }
    ventasPorCliente[cId].monto += monto;
    ventasPorCliente[cId].cantidad += 1;
  });

  const ticketPromedio = totalVentasAprobadas > 0 ?
    montoTotal / totalVentasAprobadas : 0;

  // Cotizaciones pendientes con nombres de cliente
  const pendientesDetalle = pendingQuotes.slice(0, 15).map((c) => {
    const cId = c.clienteId || "Desconocido";
    const fecha = c.createdAt && c.createdAt._seconds ?
      new Date(c.createdAt._seconds * 1000)
          .toISOString()
          .split("T")[0] :
      "N/A";
    const nombreCli = clientesMap[cId] ?
      clientesMap[cId].nombre : "Desconocido";
    return {
      id: c.id,
      cliente: nombreCli,
      total: Number(c.total || 0),
      titulo: c.tituloCotizacion || "Sin titulo",
      fecha,
    };
  });

  // Clientes activos / inactivos
  let clientesActivos = 0;
  let clientesInactivos = 0;
  Object.values(clientesMap).forEach((c) => {
    if (c.activo) clientesActivos += 1;
    else clientesInactivos += 1;
  });

  // Top días recientes
  const topDias = Object.values(ventasPorDia)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 14);

  // Top clientes
  const topClientes = Object.values(ventasPorCliente)
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10);

  return {
    resumen: {
      totalVentasAprobadas,
      montoTotal,
      utilidadNeta,
      ticketPromedio,
      cotizacionesPendientes: pendingQuotes.length,
      totalClientes: Object.keys(clientesMap).length,
      clientesActivos,
      clientesInactivos,
    },
    pendientes: pendientesDetalle,
    topDias,
    topClientes,
  };
};

// ---------------------------------------------------------------------------
// Construcción de contexto para el prompt
// ---------------------------------------------------------------------------

const buildContextFromProducts = (products) => {
  if (!products.length) {
    return "No se encontraron productos en la base de datos.";
  }

  return products
      .map((product, index) => {
        return [
          `${index + 1}. ID: ${product.id}`,
          `Nombre: ${product.nombre}`,
          `Categoria: ${product.categoria}`,
          `Modelo: ${product.modelo}`,
          `Precio: ${product.precio}`,
          `Stock: ${product.stock}`,
          `Vendidos: ${product.productosVendidos}`,
        ].join(" | ");
      })
      .join("\n");
};

const buildProductAnalyticsContext = (analytics) => {
  const {
    cheapest, mostExpensive, lowStock,
    outOfStock, bestSellers, summary, categorias,
  } = analytics;
  let ctx = "";

  ctx += "=== RESUMEN GENERAL DE PRODUCTOS ===\n";
  ctx += `Total productos: ${summary.totalProducts}\n`;
  ctx += `Stock total: ${summary.totalStock}\n`;
  ctx += `Precio promedio: $${summary.avgPrice.toFixed(2)}\n\n`;

  if (lowStock.length > 0) {
    ctx += "=== PRODUCTOS CON BAJO STOCK (<=5 unidades) ===\n";
    lowStock.forEach((p, i) => {
      ctx += `${i + 1}. ${p.nombre} | ${p.modelo} | ` +
        `${p.categoria} | Stock: ${p.stock} | Precio: $${p.precio}\n`;
    });
    ctx += "\n";
  }

  if (outOfStock.length > 0) {
    ctx += "=== PRODUCTOS AGOTADOS (Stock = 0) ===\n";
    outOfStock.slice(0, 15).forEach((p, i) => {
      ctx += `${i + 1}. ${p.nombre} | ` +
        `${p.modelo} | Precio: $${p.precio}\n`;
    });
    ctx += "\n";
  }

  ctx += "=== TOP 10 PRODUCTOS MAS BARATOS ===\n";
  cheapest.forEach((p, i) => {
    ctx += `${i + 1}. ${p.nombre} | ${p.modelo} | ` +
      `${p.categoria} | Precio: $${p.precio} | Stock: ${p.stock}\n`;
  });
  ctx += "\n";

  ctx += "=== TOP 10 PRODUCTOS MAS CAROS ===\n";
  mostExpensive.forEach((p, i) => {
    ctx += `${i + 1}. ${p.nombre} | ${p.modelo} | ` +
      `${p.categoria} | Precio: $${p.precio} | Stock: ${p.stock}\n`;
  });
  ctx += "\n";

  ctx += "=== TOP 10 PRODUCTOS MAS VENDIDOS ===\n";
  bestSellers.forEach((p, i) => {
    ctx += `${i + 1}. ${p.nombre} | ${p.modelo} | ` +
      `Vendidos: ${p.productosVendidos} | ` +
      `Precio: $${p.precio} | Stock: ${p.stock}\n`;
  });
  ctx += "\n";

  ctx += "=== PRODUCTOS POR CATEGORIA ===\n";
  categorias.forEach((c) => {
    ctx += `${c.nombre}: ${c.cantidad} productos | ` +
      `Stock total: ${c.stockTotal}\n`;
  });
  ctx += "\n";

  return ctx;
};

const buildBusinessAnalyticsContext = (analytics) => {
  const {resumen, pendientes, topDias, topClientes} = analytics;
  let ctx = "";

  ctx += "=== METRICAS DEL NEGOCIO ===\n";
  ctx += `Ventas aprobadas totales: ${resumen.totalVentasAprobadas}\n`;
  ctx += `Monto total vendido: $${resumen.montoTotal.toFixed(2)}\n`;
  ctx += `Utilidad neta total: $${resumen.utilidadNeta.toFixed(2)}\n`;
  ctx += `Ticket promedio: $${resumen.ticketPromedio.toFixed(2)}\n`;
  ctx += "Cotizaciones pendientes por aprobar: " +
    `${resumen.cotizacionesPendientes}\n`;
  ctx += `Total clientes: ${resumen.totalClientes}` +
    ` (Activos: ${resumen.clientesActivos}, ` +
    `Inactivos: ${resumen.clientesInactivos})\n\n`;

  if (pendientes.length > 0) {
    ctx += "=== COTIZACIONES PENDIENTES ===\n";
    pendientes.forEach((c, i) => {
      ctx += `${i + 1}. ${c.titulo} | Cliente: ${c.cliente} | ` +
        `Total: $${c.total.toFixed(2)} | Fecha: ${c.fecha}\n`;
    });
    ctx += "\n";
  }

  if (topDias.length > 0) {
    ctx += "=== VENTAS POR DIA (ULTIMOS 14 DIAS) ===\n";
    topDias.forEach((d) => {
      ctx += `${d.fecha}: ${d.cantidad} ventas | ` +
        `Monto: $${d.monto.toFixed(2)} | ` +
        `Utilidad: $${d.utilidad.toFixed(2)}\n`;
    });
    ctx += "\n";
  }

  if (topClientes.length > 0) {
    ctx += "=== TOP CLIENTES POR MONTO ===\n";
    topClientes.forEach((c, i) => {
      ctx += `${i + 1}. ${c.cliente} | ${c.cantidad} compras | ` +
        `Total: $${c.monto.toFixed(2)}\n`;
    });
    ctx += "\n";
  }

  return ctx;
};

// ---------------------------------------------------------------------------
// Prompt para Gemini
// ---------------------------------------------------------------------------

const buildGroundedPrompt = (
    {question, productContext, analyticsContext, intentType}) => {
  const base = [
    "Eres el asistente de ventas de Reynova.",
    "Responde en espanol claro, breve y bien organizado.",
    "Usa SIEMPRE formato Markdown: negritas, tablas," +
      " y listas cuando sea apropiado.",
    "Usa EXCLUSIVAMENTE la informacion del CONTEXTO proporcionada.",
    "Si la informacion no aparece en el contexto," +
      " di claramente que no esta disponible.",
    "No inventes precios, stock, modelos," +
      " categorias, ni metricas financieras.",
  ];

  if (intentType === "product_analytics") {
    base.push(
        "Usa tablas Markdown para mostrar listas de productos.",
    );
    base.push(
        "Destaca productos con bajo stock o agotados como alerta.",
    );
    base.push(
        "Si pregunta por 'el mas barato' da el top del contexto.",
    );
  }

  if (intentType === "business_analytics") {
    base.push(
        "Organiza la respuesta en secciones claras con tablas.",
    );
    base.push(
        "Destaca metricas clave como utilidad neta y pendientes.",
    );
    base.push(
        "Si pide un resumen, incluye las metricas mas importantes.",
    );
  }

  if (intentType === "product_specific") {
    base.push(
        "Si hay multiples coincidencias, lista opciones de forma corta.",
    );
  }

  const parts = [
    ...base,
    "",
    "PREGUNTA_USUARIO:",
    question,
    "",
  ];

  if (productContext) {
    parts.push("CONTEXTO_PRODUCTOS:", productContext, "");
  }

  if (analyticsContext) {
    parts.push("CONTEXTO_ANALITICA:", analyticsContext, "");
  }

  return parts.join("\n");
};

// ---------------------------------------------------------------------------
// Cloud Function principal
// ---------------------------------------------------------------------------

exports.chatbotReynova = onCall({
  secrets: ["GEMINI_API_KEY"],
  maxInstances: 10,
}, async (request) => {
  try {
    if (!request.auth) {
      return {
        error: "No autorizado. Debes iniciar sesion para usar el chatbot.",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {error: "Falta la API Key en la nube."};
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
        {model: "gemini-3-flash-preview"},
        {apiVersion: "v1beta"},
    );

    const mensaje = String(
        (request.data && request.data.mensaje) || "",
    ).trim();
    if (!mensaje) {
      return {error: "Debes enviar un mensaje en request.data.mensaje."};
    }

    // 1. Detectar intención
    const intent = detectQueryIntent(mensaje);

    // 2. Recolectar datos según la intención
    let productContext = "";
    let analyticsContext = "";
    let productosEncontrados = 0;

    // --- Productos relevantes (siempre se buscan) ---
    const relevantProducts = await fetchRelevantProducts(mensaje);
    productosEncontrados = relevantProducts.length;
    if (relevantProducts.length > 0) {
      productContext = buildContextFromProducts(relevantProducts);
    }

    if (intent === "product_analytics") {
      const allProducts = await fetchAllProducts(500);
      const analytics = computeProductAnalytics(allProducts);
      analyticsContext = buildProductAnalyticsContext(analytics);

      if (!productContext) {
        productContext = buildContextFromProducts(
            allProducts.slice(0, 10),
        );
      }
    } else if (intent === "business_analytics") {
      const [approvedQuotes, pendingQuotes, allProducts, clientesMap] =
        await Promise.all([
          fetchCotizacionesByStatus("aprobada", 200),
          fetchCotizacionesByStatus("pendiente", 50),
          fetchAllProducts(500),
          fetchClientesMap(),
        ]);

      const analytics = computeBusinessAnalytics(
          approvedQuotes, pendingQuotes, allProducts, clientesMap,
      );
      analyticsContext = buildBusinessAnalyticsContext(analytics);

      if (!productContext && allProducts.length > 0) {
        productContext = buildContextFromProducts(
            allProducts.slice(0, 10),
        );
      }
    } else {
      if (!productContext) {
        productContext = "No se encontraron productos en la base de datos.";
      }
    }

    // 3. Construir prompt y llamar a Gemini
    const prompt = buildGroundedPrompt({
      question: mensaje,
      productContext,
      analyticsContext,
      intentType: intent,
    });

    const result = await model.generateContent(prompt);
    const respuestaIA = result.response.text();

    return {
      respuesta: respuestaIA,
      contexto: {
        productosEncontrados,
        tipoConsulta: intent,
      },
    };
  } catch (error) {
    console.error("Error en chatbotReynova:", error);
    return {error: `Error de Gemini: ${error.message}`};
  }
});
