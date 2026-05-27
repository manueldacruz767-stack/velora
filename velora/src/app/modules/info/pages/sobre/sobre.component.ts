import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './sobre.component.html',
  styleUrl: './sobre.component.scss'
})
export class SobreComponent {}