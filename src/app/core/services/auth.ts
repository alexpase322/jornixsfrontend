import { Injectable, computed, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { AuthResponse, CompanyRegistrationRequest, LoginRequest, RegistrationCompletionRequest } from '../models/auth.models';
import { InviteRequest } from '../models/admin.models';
import { ForgotPasswordRequest } from '../models/auth.models';
import { ResetPasswordRequest } from '../models/auth.models';

interface DecodedToken {
  authorities?: string[];
  exp?: number;
}

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
      this.initializeAuthState();
    }
  }

  // --- MÉTODOS DE API ---

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.clearSession(false);

    return this.http.post<AuthResponse>(`${this.AUTH_URL}/login`, credentials).pipe(
      tap(response => {
        const role = this.handleAuthenticationSuccess(response.token);

        if (role === 'ROLE_ADMINISTRADOR') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'ROLE_TRABAJADOR') {
          this.router.navigate(['/worker/dashboard']);
        } else {
          this.clearSession(false);
          this.router.navigate(['/login']);
        }
      }),
      catchError(error => {
        this.clearSession(false);
        return throwError(() => error);
      })
    );
  }

  inviteWorker(data: InviteRequest): Observable<string> {
    return this.http.post(`${this.AUTH_URL}/invite`, data, { responseType: 'text' });
  }

  logout(): void {
    this.clearSession();
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

    if (typeof token !== 'string' || token === '') {
      return null;
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);

      if (this.isTokenExpired(decodedToken)) {
        this.clearSession(false);
        return null;
      }

      if (decodedToken.authorities && decodedToken.authorities.length > 0) {
        return decodedToken.authorities[0];
      }

      console.error('No se pudo encontrar el rol en el token. Payload:', decodedToken);
      this.clearSession(false);
      return null;
    } catch (error) {
      console.error('Token guardado es inválido. Forzando cierre de sesión.', error);
      this.clearSession(false);
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

  private saveRole(role: string | null): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (role) {
      localStorage.setItem('role', role);
      return;
    }

    localStorage.removeItem('role');
  }

  private clearSession(redirectToLogin: boolean = true): void {
    this.removeToken();
    this.saveRole(null);
    this.isAuthenticatedSignal.set(false);
    this.userRoleSignal.set(null);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private initializeAuthState(): void {
    const role = this.getRoleFromToken();
    this.userRoleSignal.set(role);
    this.isAuthenticatedSignal.set(!!role && this.hasToken());
    this.saveRole(role);
  }

  private handleAuthenticationSuccess(token: string): string | null {
    this.saveToken(token);
    const role = this.getRoleFromToken();
    this.userRoleSignal.set(role);
    this.isAuthenticatedSignal.set(!!role);
    this.saveRole(role);
    return role;
  }

  private isTokenExpired(decodedToken: DecodedToken): boolean {
    if (!decodedToken.exp) {
      return false;
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp <= currentUnixTime;
  }

  completeRegistration(data: RegistrationCompletionRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/complete-registration`, data).pipe(
      tap(response => {
        const role = this.handleAuthenticationSuccess(response.token);

        if (role === 'ROLE_TRABAJADOR') {
          this.router.navigate(['/worker/dashboard']);
        } else {
          this.clearSession(false);
          this.router.navigate(['/login']);
        }
      }),
      catchError(error => {
        this.clearSession(false);
        return throwError(() => error);
      })
    );
  }

  registerCompany(data: CompanyRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/register-company`, data).pipe(
      tap(response => {
        const role = this.handleAuthenticationSuccess(response.token);

        if (role === 'ROLE_ADMINISTRADOR') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.clearSession(false);
          this.router.navigate(['/login']);
        }
      }),
      catchError(error => {
        this.clearSession(false);
        return throwError(() => error);
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
