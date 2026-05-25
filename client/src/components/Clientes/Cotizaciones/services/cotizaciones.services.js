import {
  collection,
  doc,
  serverTimestamp,
  getDocs,
  where,
  query,
  getDoc,
  increment,
  runTransaction
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { Cotizacion } from "../models/Cotizacion";
import { CrearCotizacionSchema } from "../schemas/cotizacion.schemas";

class CotizacionesService {
  constructor() {
    this.collectionName = "cotizaciones";
  }

  async traerDocs(clienteId) {
    try {
      //  Creamos una query filtrando por clienteId
      const q = query(
        collection(db, this.collectionName),
        where("clienteId", "==", clienteId)
      );

      const snapshot = await getDocs(q);

      //  Convertimos los documentos en objetos JS
      const cotizaciones = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          productos: Array.isArray(data.productos) ? data.productos : [],
        };
      });

      return cotizaciones;
    } catch (error) {
      console.error("Error al traer cotizaciones del cliente:", error);
      throw error;
    }
  }

  _actualizarFechaUltimaCotizacionCliente(batch, clienteId) {
    const clienteRef = doc(db, "Clientes", clienteId);
    batch.update(clienteRef, { fechaUltimaCotizacion: serverTimestamp() });
  }

  async crear(datos) {
    try {
      const datosValidados = CrearCotizacionSchema.parse(datos);
      const cotizacion = Cotizacion.crear(datosValidados);
      const newDocRef = doc(collection(db, this.collectionName));
      const clienteRef = doc(db, "Clientes", datosValidados.clienteId);

      if (datosValidados.status && datosValidados.status.toLowerCase() === "aprobada") {
        await runTransaction(db, async (transaction) => {
          transaction.set(newDocRef, {
            ...cotizacion.toFirestore(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          transaction.update(clienteRef, {
            fechaUltimaCotizacion: serverTimestamp(),
          });

          for (const prod of datosValidados.productos || []) {
            const productRef = doc(db, "productos", prod.productoId);
            const productSnap = await transaction.get(productRef);

            if (!productSnap.exists()) {
              throw new Error(
                `El producto con ID ${prod.productoId} no existe en inventario.`
              );
            }

            const stockActual = productSnap.data().stock ?? 0;
            if (stockActual < prod.cantidad) {
              throw new Error(
                `Inventario insuficiente para el producto ${prod.nombre || prod.productoId}. Stock actual: ${stockActual}, Solicitado: ${prod.cantidad}`
              );
            }

            transaction.update(productRef, {
              stock: increment(-prod.cantidad),
              productosVendidos: increment(prod.cantidad),
            });
          }
        });

        return { id: newDocRef.id, ...cotizacion };
      }

      await runTransaction(db, async (transaction) => {
        transaction.set(newDocRef, {
          ...cotizacion.toFirestore(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.update(clienteRef, {
          fechaUltimaCotizacion: serverTimestamp(),
        });
      });

      return { id: newDocRef.id, ...cotizacion };
    } catch (error) {
      if (error.name === "ZodError") {
        throw new Error(`Datos inválidos:${error}`);
      }
      throw error;
    }
  }

  async actualizar(id, datos) {
    try {
      const datosValidados = CrearCotizacionSchema.partial().parse(datos);
      const docRef = doc(db, this.collectionName, id);

      const resultado = await runTransaction(db, async (transaction) => {
        // PASO 1: TODOS LOS READS PRIMERO
        const cotizacionSnap = await transaction.get(docRef);
        if (!cotizacionSnap.exists()) {
          throw new Error("La cotización no existe");
        }

        const cotizacionActual = cotizacionSnap.data();
        const statusAnterior = cotizacionActual.status?.toLowerCase();
        const statusNuevo = datosValidados.status?.toLowerCase();

        // Leer todos los productos antes de hacer cualquier write
        let productosSnapshot = [];
        let productosParaActualizar = [];

        if (statusNuevo === "aprobada" && statusAnterior !== "aprobada") {
          const productos = datosValidados.productos || cotizacionActual.productos || [];
          for (const prod of productos) {
            const productRef = doc(db, "productos", prod.productoId);
            const productSnap = await transaction.get(productRef);

            if (!productSnap.exists()) {
              throw new Error(
                `El producto con ID ${prod.productoId} no existe en inventario.`
              );
            }

            const stockActual = productSnap.data().stock ?? 0;
            if (stockActual < prod.cantidad) {
              throw new Error(
                `Inventario insuficiente para el producto ${prod.nombre || prod.productoId}. Stock actual: ${stockActual}, Solicitado: ${prod.cantidad}`
              );
            }

            productosSnapshot.push(productSnap);
            productosParaActualizar.push({ ref: productRef, action: "restar", producto: prod });
          }
        }

        if (statusAnterior === "aprobada" && statusNuevo && statusNuevo !== "aprobada") {
          const productos = datosValidados.productos || cotizacionActual.productos || [];
          for (const prod of productos) {
            const productRef = doc(db, "productos", prod.productoId);
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) {
              throw new Error(
                `El producto con ID ${prod.productoId} no existe en inventario.`
              );
            }
            productosSnapshot.push(productSnap);
            productosParaActualizar.push({ ref: productRef, action: "sumar", producto: prod });
          }
        }

        // PASO 2: TODOS LOS WRITES DESPUÉS
        transaction.update(docRef, {
          ...datosValidados,
          updatedAt: serverTimestamp(),
        });

        // Actualizar productos
        for (const item of productosParaActualizar) {
          if (item.action === "restar") {
            transaction.update(item.ref, {
              stock: increment(-item.producto.cantidad),
              productosVendidos: increment(item.producto.cantidad),
            });
          } else if (item.action === "sumar") {
            transaction.update(item.ref, {
              stock: increment(item.producto.cantidad),
              productosVendidos: increment(-item.producto.cantidad),
            });
          }
        }

        return true;
      });

      if (!resultado) {
        throw new Error("No se pudo procesar la actualización de la cotización.");
      }

      return { id, ...datosValidados };
    } catch (error) {
      if (error.name === "ZodError") {
        throw new Error(
          `Datos inválidos: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }

  async getCotizacionById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error al obtener la cotización por ID:", error);
      throw error;
    }
  }

  async enviarCotizacionPorCorreo(cotizacionId, emailDestinatario) {
    try {
      const response = await fetch(
        "https://us-central1-reynova-v2.cloudfunctions.net/enviarCotizacionPorCorreo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cotizacionId,
            emailDestinatario,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar la cotización");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al enviar cotización por correo:", error);
      throw error;
    }
  }
}

export const cotizacionesService = new CotizacionesService();