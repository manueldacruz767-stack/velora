import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastKey = '';
  private lastParams: Record<string, unknown> | undefined;
  private lastValue = '';
  private sub: Subscription;

  constructor(private translate: TranslateService, private cdr: ChangeDetectorRef) {
    this.sub = this.translate.onLangChange.subscribe(() => {
      if (this.lastKey) {
        this.lastValue = this.translate.instant(this.lastKey, this.lastParams);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  transform(key: string, params?: Record<string, unknown>): string {
    if (key !== this.lastKey || params !== this.lastParams) {
      this.lastKey = key;
      this.lastParams = params;
      this.lastValue = this.translate.instant(key, params);
    }
    return this.lastValue;
  }
}