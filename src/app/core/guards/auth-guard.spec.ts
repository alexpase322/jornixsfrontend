import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { authGuard, roleGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('authGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
      userRole: jasmine.createSpy().and.returnValue(null)
    });
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when authenticated', () => {
    (authServiceMock.isAuthenticated as jasmine.Spy).and.returnValue(true);
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
  });

  it('should redirect to login when not authenticated', () => {
    (authServiceMock.isAuthenticated as jasmine.Spy).and.returnValue(false);
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('roleGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      userRole: jasmine.createSpy().and.returnValue('ROLE_ADMINISTRADOR')
    });
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when role matches', () => {
    const guard = roleGuard('ROLE_ADMINISTRADOR');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('should redirect worker to worker dashboard when accessing admin routes', () => {
    (authServiceMock.userRole as jasmine.Spy).and.returnValue('ROLE_TRABAJADOR');
    const guard = roleGuard('ROLE_ADMINISTRADOR');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/worker/dashboard']);
  });

  it('should redirect admin to admin dashboard when accessing worker routes', () => {
    (authServiceMock.userRole as jasmine.Spy).and.returnValue('ROLE_ADMINISTRADOR');
    const guard = roleGuard('ROLE_TRABAJADOR');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should redirect to login when not authenticated', () => {
    (authServiceMock.isAuthenticated as jasmine.Spy).and.returnValue(false);
    const guard = roleGuard('ROLE_ADMINISTRADOR');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
