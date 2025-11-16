import { Directive, ElementRef, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // <-- Importar

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true,
})
export class AnimateOnScrollDirective implements OnInit {
  private element = inject(ElementRef);
  private platformId = inject(PLATFORM_ID); // <-- Inyectar el ID de la plataforma

  ngOnInit(): void {
    // --- ¡ESTA ES LA CORRECCIÓN! ---
    // Solo ejecuta este código si estamos en un navegador
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      observer.observe(this.element.nativeElement);
    }
    // --- Fin de la corrección ---
  }
}