import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { pt } from './pt';
import { en } from './en';

const translations: Record<string, any> = { pt, en };

export class CustomTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(translations[lang] || {});
  }
}
