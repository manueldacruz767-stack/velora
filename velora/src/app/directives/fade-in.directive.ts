import { Directive, ElementRef, input, OnInit, signal } from '@angular/core';

@Directive({
  selector: '[appFadeIn]',
  standalone: true,
  host: {
    '[class.fade-in-visible]': 'visible()',
    '[style.transition-delay]': 'delay() + "ms"'
  }
})
export class FadeInDirective implements OnInit {
  delay = input(0);
  visible = signal(false);

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {
    this.el.nativeElement.classList.add('fade-in-hidden');
  }

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.visible.set(true);
          this.observer?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(this.el.nativeElement);
  }
}
