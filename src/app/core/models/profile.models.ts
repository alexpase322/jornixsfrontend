// Para la respuesta que recibimos del backend al cargar la página
export interface UserProfile {
  fullName: string;
  email: string;
  streetAddress: string;
  cityStateZip: string;
  ssn: string;
}

// Para la petición que enviamos al actualizar (coincide con tu DTO)
export interface UpdateProfileRequest {
  fullName?: string;
  newPassword?: string;
  streetAddress?: string;
  cityStateZip?: string;
  ssn?: string;
}