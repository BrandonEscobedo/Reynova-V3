const functions = require("firebase-functions");
const { getFirestore } = require("firebase-admin/firestore");
const https = require("https");
const cors = require("cors")({ origin: true });

const WEBHOOK_URL = "https://hook.us2.make.com/y59ujsmua6v1qrakkpvhhfc95uv1lr3v";

// Función helper para serializar objetos de Firestore
const serializeFirestoreData = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => serializeFirestoreData(item));
    }

    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            serialized[key] = null;
        } else if (value instanceof Date) {
            serialized[key] = value.toISOString();
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Omitir objetos complejos de Firestore (Timestamps, References, etc)
            if (value.toDate && typeof value.toDate === 'function') {
                serialized[key] = value.toDate().toISOString();
            } else if (typeof value !== 'object') {
                serialized[key] = value;
            } else {
                serialized[key] = serializeFirestoreData(value);
            }
        } else if (Array.isArray(value)) {
            serialized[key] = value.map(item => serializeFirestoreData(item));
        } else {
            serialized[key] = value;
        }
    }
    return serialized;
};

const makeWebhookRequest = (payload) => {
    return new Promise((resolve, reject) => {
        let data;
        try {
            data = JSON.stringify(payload);
        } catch (err) {
            reject(new Error(`Error serializando JSON: ${err.message}`));
            return;
        }

        const options = {
            hostname: "hook.us2.make.com",
            port: 443,
            path: "/y59ujsmua6v1qrakkpvhhfc95uv1lr3v",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const req = https.request(options, (res) => {
            let responseData = "";

            res.on("data", (chunk) => {
                responseData += chunk;
            });

            res.on("end", () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        response: responseData,
                    });
                } else {
                    reject(
                        new Error(
                            `Webhook returned status ${res.statusCode}: ${responseData}`
                        )
                    );
                }
            });
        });

        req.on("error", (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
};

exports.enviarCotizacionPorCorreo = functions.https.onRequest(
    async (req, res) => {
        cors(req, res, async () => {
            // Solo aceptar POST
            if (req.method !== "POST") {
                return res.status(405).json({ error: "Método no permitido" });
            }

            // Extracción de parámetros
            const { cotizacionId, emailDestinatario } = req.body;

            // Validaciones iniciales
            if (!cotizacionId || !emailDestinatario) {
                return res.status(400).json({
                    error: "Faltan parámetros requeridos (cotizacionId, emailDestinatario).",
                });
            }

            const db = getFirestore();

            try {
                // Traemos la cotización desde Firestore
                const cotizacionRef = db.collection("cotizaciones").doc(cotizacionId);
                const docSnap = await cotizacionRef.get();

                if (!docSnap.exists) {
                    return res.status(404).json({ error: "La cotización no existe." });
                }

                const cotizacionData = docSnap.data();

                // Traemos los datos del cliente para obtener más información
                const clienteRef = db.collection("Clientes").doc(cotizacionData.clienteId);
                const clienteSnap = await clienteRef.get();
                const clienteData = clienteSnap.exists ? clienteSnap.data() : {};

                // Serializar datos de Firestore
                const cotizacionDataSerialized = serializeFirestoreData(cotizacionData);
                const clienteDataSerialized = serializeFirestoreData(clienteData);

                // Sanitizar productos: convertir a tipos básicos JSON
                const productosFormateados = (cotizacionDataSerialized.productos || []).map(p => ({
                    productoId: String(p.productoId || ""),
                    nombre: String(p.nombre || ""),
                    modelo: String(p.modelo || ""),
                    categoria: String(p.categoria || ""),
                    cantidad: Number(p.cantidad || 0),
                    precioUnitario: Number(p.precioUnitario || 0),
                    subtotal: Number(p.subtotal || 0),
                }));
                const productosHtml = productosFormateados.map(p => `
                <tr style="border-bottom:1px solid #e5e7eb;">

                <td style="padding:14px;">
                    <strong>${p.nombre}</strong><br/>
                    <span style="font-size:13px;color:#6b7280;">
                    ${p.modelo}
                    </span>
                </td>

                <td align="center" style="padding:14px;">
                    ${p.cantidad}
                </td>

                <td align="right" style="padding:14px;">
                    $ ${p.precioUnitario.toLocaleString()}
                </td>

                <td align="right" style="padding:14px;">
                    $ ${p.subtotal.toLocaleString()}
                </td>

                </tr>
                `).join("");
                // Construimos el payload para el webhook de Make
                const webhookPayload = {
                    cotizacionId: String(cotizacionId),
                    emailDestinatario: String(emailDestinatario),
                    nombreCliente: String(clienteDataSerialized.nombreEmpresa || clienteDataSerialized.nombre || "Cliente"),
                    tituloCotizacion: String(cotizacionDataSerialized.tituloCotizacion || "Cotización"),
                    total: Number(cotizacionDataSerialized.total || 0),
                    productos: productosFormateados,
                    metodoPago: String(cotizacionDataSerialized.metodoPago || "No especificado"),
                    status: String(cotizacionDataSerialized.status || "pendiente"),
                    fechaEntrega: cotizacionDataSerialized.fechaEntregaEstimado
                        ? String(cotizacionDataSerialized.fechaEntregaEstimado)
                        : null,
                    linkPublico: `${process.env.APP_URL || "http://localhost:5173"}/cotizacion/${cotizacionId}`,
                    timestamp: new Date().toISOString(),
                    productosHtml: productosHtml,
                };

                console.log("Payload para Make:", JSON.stringify(webhookPayload, null, 2));

                // Llamamos al webhook de Make
                const webhookResponse = await makeWebhookRequest(webhookPayload);

                // Registramos en la cotización que se envió el correo
                const actualizacion = {
                    emailEnviadoAt: new Date(),
                    emailDestinatario: emailDestinatario,
                    emailStatus: "enviado",
                };

                await cotizacionRef.update(actualizacion);

                return res.status(200).json({
                    success: true,
                    message: "Cotización enviada por correo exitosamente.",
                    cotizacionId: cotizacionId,
                    emailDestinatario: emailDestinatario,
                });
            } catch (error) {
                console.error("Error al enviar cotización por correo:", error);
                return res.status(500).json({
                    error: `Error al procesar la solicitud: ${error.message}`,
                });
            }
        });
    }
);
