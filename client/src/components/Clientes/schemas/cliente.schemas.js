import { z } from 'zod';

// Esquema para un contacto individual
export const ContactoSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre del contacto es requerido." }),
  apellidos: z.string().optional(),
  puesto: z.string().optional(),
  email: z.email({ message: "Debe ser un correo electrónico válido." }),
  telefono: z.string().optional(),
});

// Esquema principal para el cliente
export const ClienteSchema = z.object({
  nombreEmpresa: z.string().min(3, { message: "El nombre de la empresa debe tener al menos 3 caracteres." }),
  direccionCompleta: z.string().optional(),
  giro: z.string().optional(),
  vertical: z.string().optional(),
  
  // Campos de Autocomplete que guardan un array de strings
  clientesDeLaEmpresa: z.array(z.string()).optional(),
  productosDeInteres: z.array(z.string()).optional(),

  // Array de contactos, debe tener al menos un contacto
  contactos: z.array(ContactoSchema).min(1, { message: "Debes agregar al menos un contacto." }),
  
  // Estado del cliente (activo/inactivo)
  activo: z.boolean().optional().default(true),
});
