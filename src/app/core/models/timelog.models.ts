export interface TimeLog {
  id: number | null;
  eventType: 'INGRESO' | 'INICIO_ALMUERZO' | 'FINAL_ALMUERZO' | 'SALIDA';
  timestamp: string;
  workWeekId: number; // <-- CAMPO AÑADIDO
}

export interface ClockInRequest {
  latitude: number;
  longitude: number;
}