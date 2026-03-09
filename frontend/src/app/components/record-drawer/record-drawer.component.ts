import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-record-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './record-drawer.component.html',
  styleUrl: './record-drawer.component.scss',
})
export class RecordDrawerComponent {
  @Input() item!: any;
  @Output() close = new EventEmitter<void>();

  joinField(arr: any[], field: string): string {
    return arr?.map((x) => x[field]).join(', ') ?? '';
  }
}
