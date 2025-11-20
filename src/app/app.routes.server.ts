import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // --- RUTAS DINÁMICAS (Renderizado en Cliente) ---
  // Estas rutas dependen de IDs que no existen al momento de compilar (build),
  // por lo que le decimos a Angular que las renderice solo en el navegador.
  {
    path: 'admin/workers/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/locations/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/reports/detailed/:workerId',
    renderMode: RenderMode.Client
  },
  {
    path: 'worker/reports/detailed',
    renderMode: RenderMode.Client
  },
  {
    path: 'complete-registration',
    renderMode: RenderMode.Client
  },
  {
    path: 'reset-password',
    renderMode: RenderMode.Client
  },

  // --- RESTO DE RUTAS (Prerenderizado) ---
  // Para todo lo demás, usamos Prerender (SSG) por defecto para máxima velocidad.
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
