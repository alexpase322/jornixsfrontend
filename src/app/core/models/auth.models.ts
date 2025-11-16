export interface AuthResponse {
  token: string;
}

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface CompanyRegistrationRequest {
  token: string;
  companyName:          string;
  companyAddress:       string;
  companyPhoneNumber?:  string; // El '?' indica que es opcional
  ein:                  string;
  adminFullName:        string;
  adminEmail:           string;
  adminPassword:        string;
  workLatitude?:        number;
  workLongitude?:       number;
  geofenceRadiusMeters?: number;
}

export interface PayrollEntry {
  workerId: number;
  workerName: string;
  hourlyRate: number;
  totalHours: number;
  totalToPay: number;
}

export interface PayrollReport {
  startDate: string;
  endDate: string;
  payrollEntries: PayrollEntry[];
  grandTotalHours: number;
  grandTotalAmount: number;
}

export interface RegistrationCompletionRequest {
  token: string;
  fullName: string;
  password: string;
  streetAddress: string;
  cityStateZip: string;
  ssn: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
// Aquí añadiríamos las demás interfaces que necesitemos...