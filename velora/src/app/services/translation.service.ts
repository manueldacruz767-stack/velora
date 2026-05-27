import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'pt' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  currentLang = signal<Lang>('pt');

  constructor(private translateSvc: TranslateService) {
    const saved = (localStorage.getItem('velora_lang') as Lang) || 'pt';
    this.currentLang.set(saved);
    translateSvc.addLangs(['pt', 'en']);
    translateSvc.setDefaultLang('pt');
    translateSvc.use(saved);
  }

  switchLang(lang: Lang): void {
    this.currentLang.set(lang);
    localStorage.setItem('velora_lang', lang);
    this.translateSvc.use(lang);
  }

  translate(key: string): string | any {
    return this.translateSvc.instant(key);
  }

  get(key: string, params?: Record<string, unknown>): string | any {
    return this.translateSvc.instant(key, params);
  }

  instant(key: string, params?: Record<string, unknown>): string | any {
    return this.translateSvc.instant(key, params);
  }
}