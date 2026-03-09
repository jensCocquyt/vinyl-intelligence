export interface DiscogsConnection {
  discogsUsername: string;
  connectedAt: string;
  lastSyncCompletedAt: string | null;
  syncStatus: string;
}

export interface SyncJob {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  itemsProcessed: number | null;
  pagesProcessed: number | null;
}

export interface DashboardSummary {
  totalRecords: number;
  valuedRecords: number;
  estimatedMedianValue: number | null;
}

export interface DashboardValue {
  minValue: number | null;
  medianValue: number | null;
  maxValue: number | null;
}

export interface ChartPoint {
  count: number;
  artist?: string;
  genre?: string;
  style?: string;
  format?: string;
  decade?: string;
  country?: string | null;
}

export interface ValuableRelease {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  country: string | null;
  coverImageUrl: string | null;
  medianValue: number;
}

export interface ValueSnapshot {
  medianValue: string | number | null;
  lowestPrice: string | number | null;
  numForSale: number | null;
}

export interface CollectionItem {
  id: string;
  discogsReleaseId: number;
  title: string;
  artist: string;
  year: number | null;
  country: string | null;
  coverImageUrl: string | null;
  dateAdded: string | null;
  labels: { label: string }[];
  formats: { format: string }[];
  genres: { genre: string }[];
  styles: { style: string }[];
  valueSnapshots: ValueSnapshot[];
}
