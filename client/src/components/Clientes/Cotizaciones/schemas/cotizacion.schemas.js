import { z } from 'zod';
import { metodoCotizacion, metodoPago, status } from '../constants/metodosPago';

export const ProductoCotizadoSchema = z.object({
  productoId: z.string().min(1),
  nombre: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
  subtotal: z.number().positive(),
  modelo: z.string().optional(),
  categoria: z.string().optional(),
});

export const CotizacionSchema = z.object({
  clienteId: z.string().min(1),
  tituloCotizacion: z.string(),
  fechaEntregaEstimado: z.preprocess(
  (val) => (val === "" ? null : val),
  z.date().nullable()
),
  fechaEntregaReal:z.preprocess(
  (val) => (val === "" ? null : val),
  z.date().nullable()
),
  
  metodoCotizacion: z.enum(metodoCotizacion),
  status: z.enum(status),
  metodoPago: z.enum(metodoPago),
  
  comentarios: z.string().optional(),
  total: z.number().positive(),
  productos: z.array(ProductoCotizadoSchema),
  
  createdAt: z.date(),
  updatedAt: z.date()
});


export const CrearCotizacionSchema = CotizacionSchema.omit({
  createdAt: true,
  updatedAt: true
});