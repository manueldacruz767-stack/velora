import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static storageKey = 'velora_theme';
  isDark = signal<boolean>(this.loadTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem(ThemeService.storageKey, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.set(!this.isDark());
  }

  private loadTheme(): boolean {
    const saved = localStorage.getItem(ThemeService.storageKey);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
