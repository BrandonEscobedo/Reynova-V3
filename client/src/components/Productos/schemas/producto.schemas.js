import { z } from 'zod';

export const ProductoSchema = z.object({
  nombre: z.string().min(3, { message: "el nombre debe tener al menos 3 caracteres" }),
  modelo: z.string().optional(),
  categoria: z.string().min(1, { message: "la categoría es requerida" }),
  
  // 'preprocess' intenta convertir el texto del input a un número antes de validar
  precio: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: "el precio debe ser un número positivo" })
  ),
  // Dos Nuevos Campos
  costo_adquisicion: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: "el costo debe ser un número positivo" })
  ),
  
  stock: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int({ message: "el stock debe ser un número entero" })
  ),
  descripcion: z.string().optional(),
});
