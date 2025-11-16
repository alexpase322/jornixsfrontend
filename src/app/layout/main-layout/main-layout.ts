import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb'; 

@Component({
  selector: 'app-main-layout',
  standalone: true,
  // ASEGÚRATE DE QUE ESTE ARRAY DE IMPORTS ESTÉ COMPLETO
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    BreadcrumbComponent
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent implements OnInit {
  // Inyectamos los servicios directamente en las propiedades
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  isTermsModalOpen = signal(false); // Nueva señal para el modal
  public userRole = this.authService.userRole;
  public breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumbs.set(this.createBreadcrumbs(this.activatedRoute.root));
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', crumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return crumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      if (child.snapshot.data['breadcrumb']) {
        crumbs.push({ label: child.snapshot.data['breadcrumb'], url: url });
      }
      return this.createBreadcrumbs(child, url, crumbs);
    }
    return crumbs;
  }
}