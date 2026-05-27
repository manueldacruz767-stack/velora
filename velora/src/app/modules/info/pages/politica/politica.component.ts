import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-politica',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './politica.component.html',
  styleUrl: './politica.component.scss'
})
export class PoliticaComponent {
  openSection = signal<number | null>(0);

  toggleSection(index: number): void {
    this.openSection.set(this.openSection() === index ? null : index);
  }
}
