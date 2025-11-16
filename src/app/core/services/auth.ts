import { Injectable, computed, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { AuthResponse, CompanyRegistrationRequest, LoginRequest, RegistrationCompletionRequest } from '../models/auth.models';
import { InviteRequest } from '../models/admin.models';
import { ForgotPasswordRequest } from '../models/auth.models';
import { ResetPasswordRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_URL = `${environment.apiUrl}/auth`;
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);

  private isAuthenticatedSignal = signal<boolean>(false);
  public isAuthenticated = computed(() => this.isAuthenticatedSignal());
  
  private userRoleSignal = signal<string | null>(null);
  public userRole = computed(() => this.userRoleSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticatedSignal.set(this.hasToken());
      this.userRoleSignal.set(this.getRoleFromToken());
    }
  }

  // --- MÉTODOS DE API ---

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/login`, credentials).pipe(
      tap(response => {
        this.saveToken(response.token);
        this.isAuthenticatedSignal.set(true);
        const role = this.getRoleFromToken();
        this.userRoleSignal.set(role);
        
        if (role === 'ROLE_ADMINISTRADOR') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'ROLE_TRABAJADOR') {
          this.router.navigate(['/worker/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  inviteWorker(data: InviteRequest): Observable<string> {
    return this.http.post(`${this.AUTH_URL}/invite`, data, { responseType: 'text' });
  }

  logout(): void {
    this.removeToken();
    this.isAuthenticatedSignal.set(false);
    this.userRoleSignal.set(null);
    this.router.navigate(['/login']);
  }

  // --- MÉTODOS DE AYUDA PARA EL TOKEN ---

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }
  
  // --- ESTE ES EL MÉTODO CLAVE CORREGIDO ---
  private getRoleFromToken(): string | null {
    const token = this.getToken();
    
    // Verificación estricta: el token debe ser un string no vacío.
    if (typeof token !== 'string' || token === '') {
      return null;
    }
    
    try {
      // Envolvemos la decodificación en un bloque try...catch
      const decodedToken: any = jwtDecode(token);

      if (decodedToken.authorities && decodedToken.authorities.length > 0) {
        return decodedToken.authorities[0];
      }
      
      console.error("No se pudo encontrar el rol en el token. Payload:", decodedToken);
      return null;

    } catch (error) {
      // Si el token está corrupto, forzamos el cierre de sesión.
      console.error("Token guardado es inválido. Forzando cierre de sesión.", error);
      this.logout();
      return null;
    }
  }

  private saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
    }
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
  completeRegistration(data: RegistrationCompletionRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/complete-registration`, data).pipe(
      tap(response => {
        // Reutilizamos la misma lógica del login: guardar token y redirigir
        this.saveToken(response.token);
        this.isAuthenticatedSignal.set(true);
        const role = this.getRoleFromToken();
        this.userRoleSignal.set(role);

        if (role === 'ROLE_TRABAJADOR') {
          this.router.navigate(['/worker/dashboard']);
        } else {
          // Si por alguna razón el rol no es de trabajador, enviar a login
          this.router.navigate(['/login']);
        }
      })
    );
  }

  registerCompany(data: CompanyRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/register-company`, data).pipe(
      tap(response => {
        // Después de un registro exitoso, guardamos el token y redirigimos
        this.saveToken(response.token);
        this.isAuthenticatedSignal.set(true);
        const role = this.getRoleFromToken();
        this.userRoleSignal.set(role);
        
        // El nuevo usuario siempre será un administrador
        if (role === 'ROLE_ADMINISTRADOR') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/login']); // Fallback
        }
      })
    );
  }

  requestPasswordReset(data: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${this.AUTH_URL}/forgot-password`, data, { responseType: 'text' });
  }

  resetPassword(data: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.AUTH_URL}/reset-password`, data, { responseType: 'text' });
  }
}