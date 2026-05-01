import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './features/worker/dashboard/dashboard';
import { authGuard, roleGuard } from './core/guards/auth-guard';
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
import { PaymentSuccess } from './features/payment/payment-success/payment-success';
import { CompanyInfoComponent } from './features/admin/company-info/company-info';

export const routes: Routes = [
  // Public routes (titles indexed by search engines / shown in browser tab)
  { path: '', component: LandingComponent, title: 'Jornixs — Workforce Time Tracking & Payroll Software' },
  { path: 'login', component: LoginComponent, title: 'Log in — Jornixs' },
  { path: 'complete-registration', component: CompleteRegistrationComponent, title: 'Complete your Registration — Jornixs' },
  { path: 'register-company', component: RegisterCompanyComponent, title: 'Register your Company — Jornixs' },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Forgot Password — Jornixs' },
  { path: 'reset-password', component: ResetPasswordComponent, title: 'Reset Password — Jornixs' },
  { path: 'payment/success', component: PaymentSuccess, title: 'Payment Successful — Jornixs' },

  // Worker routes
  {
    path: 'worker',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard('ROLE_TRABAJADOR')],
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'My Dashboard — Jornixs' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'reports/detailed', component: DetailedReportComponent, title: 'My Detailed Report — Jornixs', data: { breadcrumb: 'My Detailed Report' } }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfileComponent, title: 'My Profile — Jornixs', data: { breadcrumb: 'My Profile' } },
      { path: 'timesheet-history', component: TimesheetHistoryComponent, title: 'Timesheets — Jornixs', data: { breadcrumb: 'Timesheets' } }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard('ROLE_ADMINISTRADOR')],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent, title: 'Admin Dashboard — Jornixs', data: { breadcrumb: 'Dashboard' } },
      { path: 'workers', component: WorkerListComponent, title: 'Workers — Jornixs', data: { breadcrumb: 'Workers' } },
      { path: 'workers/:id/edit', component: WorkerEditComponent, title: 'Edit Worker — Jornixs', data: { breadcrumb: 'Edit Worker' } },
      { path: 'reports/payroll', component: PayrollReportComponent, title: 'Payroll Reports — Jornixs', data: { breadcrumb: 'Payroll Report' } },
      { path: 'workers/invite', component: WorkerInviteComponent, title: 'Invite Worker — Jornixs', data: { breadcrumb: 'Invite Worker' } },
      { path: 'locations', component: LocationListComponent, title: 'Workplaces — Jornixs', data: { breadcrumb: 'Workplaces' } },
      { path: 'locations/new', component: LocationForm, title: 'New Workplace — Jornixs', data: { breadcrumb: 'New Workplace' } },
      { path: 'locations/:id/edit', component: LocationForm, title: 'Edit Workplace — Jornixs', data: { breadcrumb: 'Edit Workplace' } },
      { path: 'approvals', component: TimesheetApprovalComponent, title: 'Timesheet Approvals — Jornixs', data: { breadcrumb: 'Approvals' } },
      { path: 'reports/detailed/:workerId', component: DetailedReportComponent, title: 'Detailed Report — Jornixs', data: { breadcrumb: 'Detailed Report' } },
      { path: 'company', component: CompanyInfoComponent, title: 'Company Settings — Jornixs', data: { breadcrumb: 'Company' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
