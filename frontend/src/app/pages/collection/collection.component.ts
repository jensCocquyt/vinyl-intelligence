import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { RecordDrawerComponent } from '../../components/record-drawer/record-drawer.component';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, RecordDrawerComponent],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.scss',
})
export class CollectionComponent implements OnInit {
  private api = inject(ApiService);

  items = signal<any[]>([]);
  total = signal(0);
  loading = signal(true);
  selectedItem = signal<any>(null);

  search = '';
  genre = '';
  style = '';
  format = '';
  decade = '';
  country = '';
  sortBy = 'dateAdded';
  sortDirection = 'desc';
  page = 1;
  pageSize = 50;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.page),
      pageSize: String(this.pageSize),
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
    };
    if (this.search) params['search'] = this.search;
    if (this.genre) params['genre'] = this.genre;
    if (this.style) params['style'] = this.style;
    if (this.format) params['format'] = this.format;
    if (this.decade) params['decade'] = this.decade;
    if (this.country) params['country'] = this.country;

    this.api.getCollection(params).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.page = 1;
    this.load();
  }

  openItem(item: any): void {
    this.api.getCollectionItem(item.id).subscribe((res) => {
      this.selectedItem.set(res.item);
    });
  }

  closeDrawer(): void {
    this.selectedItem.set(null);
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.page * this.pageSize < this.total()) {
      this.page++;
      this.load();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.total() / this.pageSize);
  }
}
