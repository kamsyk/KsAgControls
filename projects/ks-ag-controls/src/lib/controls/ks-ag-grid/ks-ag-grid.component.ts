import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import {
  ClientSideRowModelModule,
  ColDef,
  ColumnState,
  IDatasource,
  IGetRowsParams,
  InfiniteRowModelModule,
  Module,
  RowModelType,
  Theme,
  themeQuartz,
} from 'ag-grid-community';
import { firstValueFrom, isObservable } from 'rxjs';

export interface KsAgGridServerRequest {
  startRow: number;
  endRow: number;
  sortModel: IGetRowsParams['sortModel'];
  filterModel: IGetRowsParams['filterModel'];
}

export interface KsAgGridServerResult<TData = unknown> {
  rows: TData[];
  lastRow?: number;
}

export interface KsAgGridServerDataService<TData = unknown> {
  getRows: (
    request: KsAgGridServerRequest,
  ) =>
    | KsAgGridServerResult<TData>
    | Promise<KsAgGridServerResult<TData>>
    | import('rxjs').Observable<KsAgGridServerResult<TData>>;
}

export type KsAgGridServerRowsFetcher<TData = unknown> = (
  request: KsAgGridServerRequest,
) =>
  | KsAgGridServerResult<TData>
  | Promise<KsAgGridServerResult<TData>>
  | import('rxjs').Observable<KsAgGridServerResult<TData>>;

export interface KsAgGridState {
  columnState: ColumnState[];
  filterModel: Record<string, unknown>;
  sortModel: unknown;
}

@Component({
  selector: 'lib-ks-ag-grid',
  imports: [AgGridModule],
  templateUrl: './ks-ag-grid.component.html',
  styleUrl: './ks-ag-grid.component.css',
  standalone: true,
})
export class KsAgGridComponent<TData = unknown> implements OnInit, OnChanges {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  @Input() rowData: TData[] | null | undefined = [];
  @Input() columnDefs: ColDef<TData>[] | null = [];
  @Input() class: string | null = null;
  @Input() style: string | null = null;
  @Input() pageSize = 25;
  @Input() themeMode: 'light' | 'dark' = 'light';

  // Uses Infinite Row Model (AG Grid Community) for server-driven sorting and filtering.
  @Input() useServerSideData = false;
  @Input() serverDataSource?: IDatasource;
  @Input() serverDataService?: KsAgGridServerDataService<TData>;
  @Input() fetchServerRows?: KsAgGridServerRowsFetcher<TData>;

  // Settings persistence
  @Input() enableSettingsPersistence = false;
  @Input() settingsStorageKey = 'ks-ag-grid-settings';
  @Input() autoRestoreSettings = true;

  @Output() settingsSaved = new EventEmitter<KsAgGridState>();
  @Output() settingsCleared = new EventEmitter<void>();
  @Output() settingsRestored = new EventEmitter<KsAgGridState>();

  private readonly lightTheme: Theme = themeQuartz;
  private readonly darkTheme: Theme = themeQuartz.withParams({
    backgroundColor: '#1e1e1e',
    foregroundColor: '#ffffff',
    browserColorScheme: 'dark',
  });

  get theme(): Theme {
    return this.themeMode === 'dark' ? this.darkTheme : this.lightTheme;
  }
  readonly modules: Module[] = [ClientSideRowModelModule, InfiniteRowModelModule];
  readonly defaultColDef: ColDef<TData> = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true,
  };

  datasource?: IDatasource;
  loading = false;

  get rowModelType(): RowModelType {
    return this.useServerSideData ? 'infinite' : 'clientSide';
  }

  get gridClass(): string {
    const themeClass = this.themeMode === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';
    return this.class ? `${themeClass} ${this.class}` : themeClass;
  }

  ngOnInit(): void {
    this.configureDataSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['useServerSideData'] ||
      changes['serverDataSource'] ||
      changes['serverDataService'] ||
      changes['fetchServerRows']
    ) {
      this.configureDataSource();
    }
  }

  private configureDataSource(): void {
    if (!this.useServerSideData) {
      this.datasource = undefined;
      return;
    }

    if (this.serverDataSource) {
      this.datasource = this.serverDataSource;
      return;
    }

    if (this.serverDataService) {
      this.datasource = this.createFetcherDataSource((request) =>
        this.serverDataService!.getRows(request),
      );
      return;
    }

    if (this.fetchServerRows) {
      this.datasource = this.createFetcherDataSource(this.fetchServerRows);
      return;
    }

    this.datasource = undefined;
  }

  private createFetcherDataSource(
    fetchRows: KsAgGridServerRowsFetcher<TData>,
  ): IDatasource {
    return {
      getRows: async (params: IGetRowsParams): Promise<void> => {
        this.loading = true;

        try {
          const result = await this.resolveServerRows(fetchRows, params);
          params.successCallback(result.rows, result.lastRow ?? -1);
        } catch {
          params.failCallback();
        } finally {
          this.loading = false;
        }
      },
    };
  }

  private async resolveServerRows(
    fetchRows: KsAgGridServerRowsFetcher<TData>,
    params: IGetRowsParams,
  ): Promise<KsAgGridServerResult<TData>> {
    const response = fetchRows({
      startRow: params.startRow,
      endRow: params.endRow,
      sortModel: params.sortModel,
      filterModel: params.filterModel,
    });

    if (isObservable(response)) {
      return firstValueFrom(response);
    }

    return Promise.resolve(response);
  }

  /**
   * Save current grid settings to localStorage
   */
  saveSettings(): void {
    if (!this.agGrid?.api) {
      console.warn('AG Grid API not available');
      return;
    }

    const state: KsAgGridState = {
      columnState: this.agGrid.api.getColumnState() ?? [],
      filterModel: this.agGrid.api.getFilterModel() ?? {},
      sortModel: this.agGrid.api.getColumnState()
        ?.filter((col: ColumnState) => col.sort != null)
        .map((col: ColumnState) => ({ colId: col.colId, sort: col.sort, sortIndex: col.sortIndex })) ?? [],
    };

    try {
      localStorage.setItem(this.settingsStorageKey, JSON.stringify(state));
      this.settingsSaved.emit(state);
    } catch (error) {
      console.error('Failed to save grid settings:', error);
    }
  }

  /**
   * Clear saved grid settings from localStorage
   */
  clearSettings(): void {
    try {
      localStorage.removeItem(this.settingsStorageKey);
      this.settingsCleared.emit();
    } catch (error) {
      console.error('Failed to clear grid settings:', error);
    }
  }

  /**
   * Restore grid settings from localStorage
   */
  restoreSettings(): boolean {
    if (!this.agGrid?.api) {
      console.warn('AG Grid API not available');
      return false;
    }

    try {
      const savedSettings = localStorage.getItem(this.settingsStorageKey);
      if (!savedSettings) {
        return false;
      }

      const state: KsAgGridState = JSON.parse(savedSettings);

      if (state.columnState) {
        this.agGrid.api.applyColumnState({ state: state.columnState, applyOrder: true });
      }

      if (state.filterModel) {
        this.agGrid.api.setFilterModel(state.filterModel);
      }

      this.settingsRestored.emit(state);
      return true;
    } catch (error) {
      console.error('Failed to restore grid settings:', error);
      return false;
    }
  }

  /**
   * Called when grid is ready
   */
  onGridReady(): void {
    if (this.enableSettingsPersistence && this.autoRestoreSettings) {
      // Defer restoration to ensure grid is fully initialized
      setTimeout(() => this.restoreSettings(), 0);
    }
  }
}
