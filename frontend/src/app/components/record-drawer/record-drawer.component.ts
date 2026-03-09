import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CollectionItem } from '../../types/models';

@Component({
  selector: 'app-record-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './record-drawer.component.html',
  styleUrl: './record-drawer.component.css',
})
export class RecordDrawerComponent {
  @Input() item!: CollectionItem;
  @Output() closed = new EventEmitter<void>();

  joinField(arr: { [key: string]: string }[], field: string): string {
    return arr?.map((x) => x[field]).join(', ') ?? '';
  }

  medianValue(): string | null {
    const snap = this.item.valueSnapshots[0];
    if (!snap || snap.medianValue == null) return null;
    return '$' + (+snap.medianValue).toFixed(2);
  }
}
