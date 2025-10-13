import { z } from 'zod';

// Publication validation schema
export const publicationSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(5000, 'La descripción no puede exceder 5000 caracteres'),
  category: z.string()
    .min(1, 'Debes seleccionar una categoría'),
});

// Provider profile validation schema
export const providerProfileSchema = z.object({
  business_name: z.string()
    .trim()
    .min(1, 'El nombre del negocio es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  categories: z.array(z.string())
    .min(1, 'Debes seleccionar al menos una categoría'),
  service_area: z.string()
    .trim()
    .min(1, 'La zona de servicio es obligatoria')
    .max(200, 'La zona no puede exceder 200 caracteres'),
  whatsapp: z.string()
    .trim()
    .min(1, 'El WhatsApp es obligatorio')
    .regex(/^[0-9]+$/, 'Solo se permiten números'),
  website: z.string()
    .trim()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
  facebook: z.string()
    .trim()
    .max(200, 'La URL no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),
  instagram: z.string()
    .trim()
    .max(100, 'El usuario no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
});

// Message validation schema
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'El mensaje no puede estar vacío')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

// Review validation schema
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Debes seleccionar una calificación')
    .max(5, 'La calificación máxima es 5'),
  comment: z.string()
    .trim()
    .max(500, 'El comentario no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
});
