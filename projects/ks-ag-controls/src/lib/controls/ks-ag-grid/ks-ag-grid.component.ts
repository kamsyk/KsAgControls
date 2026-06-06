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
  CellValueChangedEvent,
  CellClickedEvent,
  ICellRendererParams,
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
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
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

  // Editing and deletion
  @Input() enableEditing = false;
  @Input() enableRowDeletion = false;
  @Input() enableActionButtons = false; // Show edit/save/delete buttons in first column

  @Output() settingsSaved = new EventEmitter<KsAgGridState>();
  @Output() settingsCleared = new EventEmitter<void>();
  @Output() settingsRestored = new EventEmitter<KsAgGridState>();
  @Output() addItem = new EventEmitter<void>();
  @Output() rowDeleted = new EventEmitter<TData>();
  @Output() rowSaved = new EventEmitter<TData>();
  @Output() cellValueChanged = new EventEmitter<{ data: TData; field: string; oldValue: unknown; newValue: unknown }>();

  private editingRows = new Set<TData>();

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

  get defaultColDef(): ColDef<TData> {
    return {
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      resizable: true,
      editable: (params) => {
        if (this.enableActionButtons) {
          // Only editable when row is in edit mode
          return params.data ? this.editingRows.has(params.data) : false;
        }
        return this.enableEditing;
      },
    };
  }

  get effectiveColumnDefs(): ColDef<TData>[] {
    if (!this.columnDefs) return [];

    const columns: ColDef<TData>[] = [...this.columnDefs];

    // Add action buttons column (edit/save/delete)
    if (this.enableActionButtons) {
      const actionsColumn = {
        headerName: 'Actions',
        width: 180,
        minWidth: 180,
        maxWidth: 180,
        pinned: 'left',
        sortable: false,
        filter: false,
        editable: false,
        resizable: false,
        cellRenderer: (params: ICellRendererParams<TData>) => {
          if (!params.data) return '';

          const isEditing = this.editingRows.has(params.data);

          if (isEditing) {
            return `
              <div class="action-buttons">
                <button class="save-btn" data-action="save">Save</button>
                <button class="cancel-btn" data-action="cancel">Cancel</button>
              </div>
            `;
          } else {
            return `
              <div class="action-buttons">
                <button class="edit-btn" data-action="edit">Edit</button>
                <button class="delete-btn" data-action="delete">Delete</button>
              </div>
            `;
          }
        },
        onCellClicked: (params: CellClickedEvent<TData>) => {
          if (!params.data) return;

          const target = (params.event as MouseEvent).target as HTMLElement;
          const action = target.getAttribute('data-action');

          switch (action) {
            case 'edit':
              this.enterEditMode(params.data);
              break;
            case 'save':
              this.saveRow(params.data);
              break;
            case 'cancel':
              this.cancelEdit(params.data);
              break;
            case 'delete':
              this.deleteRow(params.data);
              break;
          }
        },
      } as ColDef<TData>;
      columns.unshift(actionsColumn);
    }
    // Fallback to simple delete button column
    else if (this.enableRowDeletion) {
      const deleteColumn = {
        headerName: '',
        width: 70,
        minWidth: 70,
        maxWidth: 70,
        pinned: 'left',
        sortable: false,
        filter: false,
        editable: false,
        resizable: false,
        cellRenderer: () => {
          return '<button class="delete-btn" style="cursor: pointer; padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px;">Delete</button>';
        },
        onCellClicked: (params: CellClickedEvent<TData>) => {
          if (params.data) {
            this.deleteRow(params.data);
          }
        },
      } as ColDef<TData>;
      columns.unshift(deleteColumn);
    }

    return columns;
  }

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

  /**
   * Emit event to parent component to add a new item
   */
  addNewItem(): void {
    this.addItem.emit();
  }

  /**
   * Enter edit mode for a row
   */
  enterEditMode(data: TData): void {
    this.editingRows.add(data);
    this.refreshGrid();
  }

  /**
   * Save row changes and exit edit mode
   */
  saveRow(data: TData): void {
    this.editingRows.delete(data);
    this.rowSaved.emit(data);
    this.refreshGrid();
  }

  /**
   * Cancel editing and exit edit mode
   */
  cancelEdit(data: TData): void {
    this.editingRows.delete(data);
    this.refreshGrid();
  }

  /**
   * Delete a row from the grid
   */
  deleteRow(data: TData): void {
    if (!this.agGrid?.api) {
      console.warn('AG Grid API not available');
      return;
    }

    // Remove from editing set if present
    this.editingRows.delete(data);

    // Emit the deletion event to parent
    this.rowDeleted.emit(data);

    // For client-side row model, remove from grid
    if (!this.useServerSideData && this.rowData) {
      const rowNode = this.agGrid.api.getRowNode(String(this.rowData.indexOf(data)));
      if (rowNode) {
        this.agGrid.api.applyTransaction({ remove: [data] });
      }
    }
  }

  /**
   * Refresh the grid to update cell renderers
   */
  private refreshGrid(): void {
    if (this.agGrid?.api) {
      this.agGrid.api.refreshCells({ force: true });
    }
  }

  /**
   * Called when a cell value changes
   */
  onCellValueChanged(event: CellValueChangedEvent<TData>): void {
    if (event.data && event.colDef.field) {
      this.cellValueChanged.emit({
        data: event.data,
        field: event.colDef.field,
        oldValue: event.oldValue,
        newValue: event.newValue,
      });
    }
  }

}
