import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login'; 
import { MainLayoutComponent } from './layout/main-layout/main-layout'; 
import { DashboardComponent } from './features/worker/dashboard/dashboard';
import { authGuard } from './core/guards/auth-guard'; 
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard'; 
import { WorkerListComponent } from './features/admin/worker-list/worker-list';
import { WorkerEditComponent } from './features/admin/worker-edit/worker-edit';
import { PayrollReportComponent } from './features/admin/payroll-report/payroll-report';
import { WorkerInviteComponent } from './features/admin/worker-invite/worker-invite';
import { CompleteRegistrationComponent } from './auth/complete-registration/complete-registration';
import { RegisterCompanyComponent } from './auth/register-company/register-company';
import { LocationListComponent } from './features/admin/location-list/location-list';
import { LocationForm } from './features/admin/location-form/location-form';
import { ProfileComponent } from './features/profile/profile';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password'; 
import { ResetPasswordComponent } from './auth/reset-password/reset-password';
import { TimesheetApprovalComponent } from './features/admin/timesheet-approval/timesheet-approval';
import { DetailedReportComponent } from './features/admin/detailed-report/detailed-report';
import { TimesheetHistoryComponent } from './features/timesheet-history/timesheet-history';
import { LandingComponent } from './landing/landing';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'complete-registration', component: CompleteRegistrationComponent }, // <-- AÑADIR
  { path: 'register-company', component: RegisterCompanyComponent }, // <-- Asegúrate de que esta línea exista
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'home', component: LandingComponent },
  // Rutas de Trabajador
  { 
    path: 'worker', 
    component: MainLayoutComponent,
    canActivate: [authGuard], 
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'reports/detailed', component: DetailedReportComponent, data: { breadcrumb: 'Mi Reporte Detallado' } }
    ]
  },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfileComponent, data: { breadcrumb: 'Mi Perfil' } },
      { path: 'timesheet-history', component: TimesheetHistoryComponent, data: { breadcrumb: 'Mis Hojas de Horas' } }
      // ... (resto de rutas como dashboards, etc.)
    ]
  },
  // Rutas de Administrador
  { 
    path: 'admin', 
    component: MainLayoutComponent,
    canActivate: [authGuard], 
    children: [
      { path: 'dashboard', component: AdminDashboardComponent, data: { breadcrumb: 'Dashboard' } },
      { path: 'workers', component: WorkerListComponent, data: { breadcrumb: 'Trabajadores' } },
      { path: 'workers/:id/edit', component: WorkerEditComponent, data: { breadcrumb: 'Editar Trabajador' } }, // <-- Etiqueta estática por ahora
      { path: 'reports/payroll', component: PayrollReportComponent, data: { breadcrumb: 'Reporte de Nómina' } }, 
      { path: 'workers/invite', component: WorkerInviteComponent, data: { breadcrumb: 'Invitar Trabajador' } },
      { path: 'locations', component: LocationListComponent, data: { breadcrumb: 'Lugares de Trabajo' } },
      { path: 'locations/new', component: LocationForm, data: { breadcrumb: 'Nuevo Lugar' } },
      { path: 'locations/:id/edit', component: LocationForm, data: { breadcrumb: 'Editar Lugar' } },
      { path: 'approvals', component: TimesheetApprovalComponent, data: { breadcrumb: 'Aprobaciones' } },
      { path: 'reports/detailed/:workerId', component: DetailedReportComponent, data: { breadcrumb: 'Reporte Detallado' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Redirigir la ruta raíz a login por defecto
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
  // Redirigir cualquier otra ruta no encontrada
  { path: '', redirectTo: 'home' }
];