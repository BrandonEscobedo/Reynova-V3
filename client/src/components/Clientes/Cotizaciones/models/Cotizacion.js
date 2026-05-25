import { Timestamp } from 'firebase/firestore';
import { CotizacionSchema } from '../schemas/cotizacion.schemas';

export class Cotizacion {
  constructor(data) {
    const validated = CotizacionSchema.parse(data);
    Object.assign(this, validated);
  }

  toFirestore() {
    return {
      clienteId: this.clienteId,
      tituloCotizacion: this.tituloCotizacion,
        fechaEntregaEstimado: this.fechaEntregaEstimado,
        fechaEntregaReal: this.fechaEntregaReal, 
      total: this.total,
      status: this.status,
      productos: this.productos,
      createdAt: Timestamp.fromDate(this.createdAt),
      updatedAt: Timestamp.fromDate(this.updatedAt)
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Cotizacion({
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    });
  }

  static crear(datos) {
    const ahora = new Date();
    return new Cotizacion({
      ...datos,
      createdAt: ahora,
      updatedAt: ahora
    });
  }
}