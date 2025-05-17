
// src/app/(app)/admin-dashboard/visitors/schemas.ts
import { z } from "zod";

export const TIPO_DOCUMENTO = ["CC", "CE", "TI", "Pasaporte", "Otro"] as const;
export const GENERO = ["Masculino", "Femenino", "No binario", "Prefiero no decir", "Otro"] as const;
export const RH = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
export const TIPO_VISITA = ["Programada", "No Programada", "Contratista", "Mensajería", "Entrevista", "Proveedor", "Cliente", "Otro"] as const;

export const visitorRegistrationSchema = z.object({
  // Visit Details
  personavisitada: z.string().min(3, { message: "El nombre de la persona visitada es requerido." }),
  purpose: z.string().min(5, { message: "El propósito de la visita es requerido." }),
  category: z.string().optional(), // AI Suggested
  tipovisita: z.enum(TIPO_VISITA, { required_error: "El tipo de visita es requerido." }),

  // Visitor Personal Information
  tipodocumento: z.enum(TIPO_DOCUMENTO, { required_error: "El tipo de documento es requerido." }),
  numerodocumento: z.string().min(5, { message: "El número de documento es requerido." }),
  nombres: z.string().min(2, { message: "El nombre es requerido." }),
  apellidos: z.string().min(2, { message: "Los apellidos son requeridos." }),
  genero: z.enum(GENERO, { required_error: "El género es requerido." }),
  fechanacimiento: z.date({ required_error: "La fecha de nacimiento es requerida." }),
  rh: z.enum(RH, { required_error: "El RH es requerido." }),
  telefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { message: "Número de teléfono inválido." }),

  // Additional Visitor Information (Optional)
  empresaProviene: z.string().optional(),
  numerocarnet: z.string().optional(),
  vehiculoPlaca: z.string().optional(),

  // Health & Safety
  arl: z.string().min(2, { message: "ARL es requerida." }),
  eps: z.string().min(2, { message: "EPS es requerida." }),

  // Emergency Contact
  contactoemergencianombre: z.string().min(2, { message: "Nombre del contacto de emergencia requerido." }),
  contactoemergenciaapellido: z.string().min(2, { message: "Apellido del contacto de emergencia requerido." }),
  contactoemergenciatelefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { message: "Teléfono de emergencia inválido." }),
  contactoemergenciaparentesco: z.string().min(2, { message: "Parentesco del contacto de emergencia requerido." }),
});

export type VisitorFormData = z.infer<typeof visitorRegistrationSchema>;

export interface VisitorEntry extends VisitorFormData {
  id: string;
  horaentrada: Date;
  horasalida: Date | null;
  estado: "activa" | "finalizada";
}
