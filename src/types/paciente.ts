/**
 * Tipo canónico del paciente.
 * Importar desde aquí en todos los componentes, servicios y schemas.
 */
export type Paciente = {
  id?: number;
  historia?: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  sexo?: "M" | "F" | "O";
  dpi_nit?: string;
  telefono?: string;
  email?: string;
  contacto_emergencia?: string;
  alergias?: string;
  antecedentes?: string;
  medicamentos?: string;
  fecha_registro?: string;
};

export type PacienteCreate = Omit<Paciente, "id" | "fecha_registro">;
export type PacienteUpdate = Partial<PacienteCreate>;
