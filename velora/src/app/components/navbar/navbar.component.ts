import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CartService } from '../../services/cart.service';
import { ThemeService } from '../../services/theme.service';
import { TranslationService, Lang } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isScrolled = signal(false);
  isMenuOpen = signal(false);
  searchValue = signal('');

  constructor(
    public cartService: CartService,
    public themeService: ThemeService,
    public translationService: TranslationService,
    public authService: AuthService,
    private router: Router
  ) {}

  switchLang(lang: Lang): void {
    this.translationService.switchLang(lang);
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen.set(false);
    this.router.navigate(['/']);
  }

  onSearch(): void {
    const query = this.searchValue().trim();
    if (query) {
      this.router.navigate(['/produtos'], { queryParams: { q: query } });
      this.searchValue.set('');
    }
  }

  openSocial(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }
}
