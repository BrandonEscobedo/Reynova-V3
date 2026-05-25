import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";

class ProductosService {
  constructor() {
    this.collecionName = "productos";
  }

async  crearSubcoleccionHistorial(productoDocId, nuevoPrecio) {
  try {
    const historialRef = collection(db, "productos", productoDocId, "historial");

    await addDoc(historialRef, {
      precioNuevoVenta: nuevoPrecio,
      fecha: new Date()
    });

    console.log("Historial agregado correctamente");
  } catch (error) {
    console.error("Error al gestionar historial:", error);
    throw error;
  }
}

async updateCantidadVentas(productoDocId, cantidadVendida, status) {
  try {
    const productoRef = doc(db, this.collecionName, productoDocId);
    
    // Obtener el documento actual
    const productoSnap = await getDoc(productoRef);
    
    // Verificar si el documento existe
    if (!productoSnap.exists()) {
      throw new Error('Producto no encontrado');
    }
    
    // Obtener el valor actual de productosVendidos
    let totalVentas = productoSnap.data().productosVendidos || 0;
    
    if (status === "aprobada") {
      totalVentas += cantidadVendida; 
    } else {
      totalVentas -= cantidadVendida;
    }
    
    // Asegurar que no sea negativo
    totalVentas = Math.max(0, totalVentas);
    
    await updateDoc(productoRef, { productosVendidos: totalVentas });

    return { productoDocId };
    
  } catch (error) {
    console.error('Error al actualizar cantidad de ventas:', error);
    throw error;
  }
}

async getProductos(){
    try {
        const snapshot = await getDocs(collection(db, this.collecionName));
        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
      } catch (error) {
        console.error("error obteniendo productos:", error);
        throw new Error("no se pudieron cargar los productos");
      }
}
}

export const productosService = new ProductosService();