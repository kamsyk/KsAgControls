import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
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
  ClientSideRowModelApiModule,
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
  RowEditingStartedEvent,
  RowEditingStoppedEvent,
  RowValueChangedEvent,
  RowClickedEvent,
  CellFocusedEvent,
  ICellRendererParams,
  ColumnApiModule,
  RowApiModule,
  ScrollApiModule,
  RenderApiModule,
  TextEditorModule,
  NumberEditorModule,
  DateEditorModule,
  CheckboxEditorModule,
  CustomEditorModule,
} from 'ag-grid-community';
import { firstValueFrom, isObservable } from 'rxjs';
import { KsIconComponent } from '../ks-icon/ks-icon.component';
import { KS_ICONS, KsIconName } from '../ks-icon/ks-icons';

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
  imports: [AgGridModule, KsIconComponent],
  templateUrl: './ks-ag-grid.component.html',
  styleUrl: './ks-ag-grid.component.css',
  standalone: true,
})
export class KsAgGridComponent<TData = unknown> implements OnInit, OnChanges {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  @ViewChild(AgGridAngular, { read: ElementRef }) private agGridEl?: ElementRef<HTMLElement>;

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
  /** Values captured when a row enters edit mode, so Cancel can discard edits. */
  private editSnapshots = new Map<TData, Record<string, unknown>>();

  private cachedDefaultColDef?: ColDef<TData>;
  private cachedDefaultColDefKey?: string;
  private cachedEffectiveColumnDefs?: ColDef<TData>[];
  private cachedColumnDefsInput: ColDef<TData>[] | null | undefined;
  private cachedActionButtons?: boolean;
  private cachedRowDeletion?: boolean;
  private readonly emptyColumnDefs: ColDef<TData>[] = [];

  private readonly lightTheme: Theme = themeQuartz.withParams({
    accentColor: 'var(--ks-grid-accent)',
    backgroundColor: 'var(--ks-grid-surface)',
    foregroundColor: 'var(--ks-grid-text)',
    borderColor: 'var(--ks-grid-border)',
    headerBackgroundColor: 'var(--ks-grid-subtle)',
    headerTextColor: 'var(--ks-grid-muted)',
    oddRowBackgroundColor: 'var(--ks-grid-surface)',
    rowHoverColor: 'var(--ks-grid-hover)',
    selectedRowBackgroundColor: 'var(--ks-grid-selected)',
    fontFamily: 'inherit',
    fontSize: 13,
    headerFontSize: 12,
    headerFontWeight: 600,
    rowHeight: 48,
    headerHeight: 44,
    columnBorder: false,
    wrapperBorder: false,
    wrapperBorderRadius: 0,
    cellHorizontalPadding: 16,
    browserColorScheme: 'light',
  });
  private readonly darkTheme: Theme = this.lightTheme.withParams({
    browserColorScheme: 'dark',
  });

  get theme(): Theme {
    return this.themeMode === 'dark' ? this.darkTheme : this.lightTheme;
  }
  readonly modules: Module[] = [
    ClientSideRowModelModule, ClientSideRowModelApiModule, InfiniteRowModelModule,
    ColumnApiModule, RowApiModule, ScrollApiModule, RenderApiModule,
    TextEditorModule, NumberEditorModule, DateEditorModule, CheckboxEditorModule,
    CustomEditorModule,
  ];

  get defaultColDef(): ColDef<TData> {
    const key = `${this.enableActionButtons}:${this.enableEditing}`;
    if (this.cachedDefaultColDef && this.cachedDefaultColDefKey === key) {
      return this.cachedDefaultColDef;
    }

    this.cachedDefaultColDefKey = key;
    this.cachedDefaultColDef = {
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
    return this.cachedDefaultColDef;
  }

  get effectiveColumnDefs(): ColDef<TData>[] {
    if (
      this.cachedEffectiveColumnDefs &&
      this.cachedColumnDefsInput === this.columnDefs &&
      this.cachedActionButtons === this.enableActionButtons &&
      this.cachedRowDeletion === this.enableRowDeletion
    ) {
      return this.cachedEffectiveColumnDefs;
    }

    this.cachedColumnDefsInput = this.columnDefs;
    this.cachedActionButtons = this.enableActionButtons;
    this.cachedRowDeletion = this.enableRowDeletion;

    if (!this.columnDefs) {
      this.cachedEffectiveColumnDefs = this.emptyColumnDefs;
      return this.cachedEffectiveColumnDefs;
    }

    const columns: ColDef<TData>[] = [...this.columnDefs];

    // Add action buttons column (edit/save/delete)
    if (this.enableActionButtons) {
      const actionsColumn: ColDef<TData> = {
        colId: 'ks-ag-grid-actions',
        headerName: 'Actions',
        width: 104,
        minWidth: 104,
        maxWidth: 104,
        flex: 0,
        pinned: 'left',
        sortable: false,
        filter: false,
        editable: false,
        resizable: false,
        cellClass: 'ks-grid-action-cell',
        cellRendererParams: { suppressMouseEventHandling: () => true },
        cellRenderer: (params: ICellRendererParams<TData>) => this.renderRowActions(params),
        onCellClicked: (params) => this.onActionClicked(params),
        suppressKeyboardEvent: ({ event }) => this.suppressActionKeyboardEvent(event),
      };
      columns.unshift(actionsColumn);
    }
    // Fallback to simple delete button column
    else if (this.enableRowDeletion) {
      const deleteColumn: ColDef<TData> = {
        colId: 'ks-ag-grid-delete',
        headerName: 'Actions',
        width: 72,
        minWidth: 72,
        maxWidth: 72,
        flex: 0,
        pinned: 'left',
        sortable: false,
        filter: false,
        editable: false,
        resizable: false,
        cellClass: 'ks-grid-action-cell',
        cellRendererParams: { suppressMouseEventHandling: () => true },
        cellRenderer: (params: ICellRendererParams<TData>) => this.renderRowActions(params, true),
        onCellClicked: (params) => this.onActionClicked(params),
        suppressKeyboardEvent: ({ event }) => this.suppressActionKeyboardEvent(event),
      };
      columns.unshift(deleteColumn);
    }

    this.cachedEffectiveColumnDefs = columns;
    return columns;
  }

  private renderRowActions(params: ICellRendererParams<TData>, deleteOnly = false): string {
    if (!params.data) return '';

    const buttons = deleteOnly
      ? this.renderActionButton('delete', 'delete', 'Delete row')
      : this.editingRows.has(params.data)
        ? this.renderActionButton('save', 'check', 'Save row') +
          this.renderActionButton('cancel', 'close', 'Cancel editing')
        : this.renderActionButton('edit', 'edit', 'Edit row') +
          this.renderActionButton('delete', 'delete', 'Delete row');

    return `<div class="ks-grid-row-actions">${buttons}</div>`;
  }

  private renderActionButton(action: string, name: KsIconName, label: string): string {
    const icon = KS_ICONS[name];
    return `<button type="button" class="ks-grid-action ks-grid-action--${action}"
      data-action="${action}" aria-label="${label}" title="${label}">
      <svg viewBox="${icon.viewBox}" aria-hidden="true" focusable="false">
        <path d="${icon.path}"></path>
      </svg>
    </button>`;
  }

  private onActionClicked(params: CellClickedEvent<TData>): void {
    const target = params.event?.target;
    if (!params.data || !(target instanceof Element)) return;

    // SVG paths, not just the button itself, can be the click target.
    const button = target.closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const cell = button.closest<HTMLElement>('.ag-cell');
    const restoreFocus = button === button.ownerDocument.activeElement;
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
    // Refreshing replaces the buttons; keep keyboard focus in the surviving cell.
    if (restoreFocus && action !== 'delete' && action !== 'edit') {
      cell?.focus();
    }
  }

  private suppressActionKeyboardEvent(event: KeyboardEvent): boolean {
    if (!(event.target instanceof Element)) return false;

    const button = event.target.closest('button[data-action]');
    if (event.key === 'Enter' || event.key === ' ') {
      return !!button;
    }
    if (event.key !== 'Tab') return false;

    const buttons = event.target.closest('.ag-cell')
      ?.querySelectorAll('button[data-action]');
    if (!buttons?.length) return false;

    // Let native Tab reach each button; hand navigation back to the grid at the edges.
    return event.shiftKey
      ? !!button && button !== buttons[0]
      : button !== buttons[buttons.length - 1];
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
   * Add a new blank item to the grid and open it in edit mode
   */
  addNewItem(): void {
    if (!this.agGrid?.api) {
      console.warn('AG Grid API not available');
      return;
    }

    // For server-side data, just emit the event - parent should handle it
    if (this.useServerSideData) {
      this.addItem.emit();
      return;
    }

    // Create a new blank item
    const newItem = {} as TData;

    // Add to grid using transaction API
    const result = this.agGrid.api.applyTransaction({ add: [newItem], addIndex: 0 });

    if (result && result.add && result.add.length > 0) {
      // Enter edit mode for the new row
      this.enterEditMode(newItem);

      // Emit event for parent component awareness
      this.addItem.emit();
    }
  }

  /**
   * Enter edit mode for a row
   */
  enterEditMode(data: TData): void {
    for (const editingData of this.editingRows) {
      if (editingData !== data) {
        this.saveRow(editingData);
      }
    }
    this.captureEditSnapshot(data);
    this.editingRows.add(data);
    this.refreshGrid();
    this.startEditorsForRow(data);
  }

  /** Open full-row editors for an already-tracked edit row. */
  private startEditorsForRow(data: TData): void {
    const api = this.agGrid?.api;
    if (!api) {
      return;
    }

    // Row indices can differ from rowData order after sorting or pagination.
    api.forEachNode((node) => {
      if (node.data !== data || node.rowIndex == null) return;
      const column = api.getAllDisplayedColumns().find((col) => col.isCellEditable(node));
      if (!column) return;

      api.ensureIndexVisible(node.rowIndex);
      api.startEditingCell({
        rowIndex: node.rowIndex,
        colKey: column,
        rowPinned: node.rowPinned ?? undefined,
      });
    });
  }

  /**
   * Save row changes and exit edit mode
   */
  saveRow(data: TData): void {
    this.editSnapshots.delete(data);
    this.editingRows.delete(data);
    this.agGrid?.api?.stopEditing(false);
    this.rowSaved.emit(data);
    this.refreshGrid();
  }

  onRowEditingStarted(event: RowEditingStartedEvent<TData>): void {
    if (!event.data || !this.enableActionButtons) {
      return;
    }

    // Track the row and refresh actions so Save/Cancel replace Edit/Delete.
    if (!this.editingRows.has(event.data)) {
      this.captureEditSnapshot(event.data);
      this.editingRows.add(event.data);
    }
    this.refreshGrid();
  }

  onRowValueChanged(event: RowValueChangedEvent<TData>): void {
    if (!event.data || !this.enableActionButtons || !this.editingRows.has(event.data)) {
      return;
    }

    // Editors can briefly stop while focus moves between cells in the same row.
    // Values are already applied to the row; reopen editors instead of saving.
    if (this.isFocusOnEditingData(event.api, event.data)) {
      queueMicrotask(() => {
        if (this.editingRows.has(event.data!)) {
          this.startEditorsForRow(event.data!);
        }
      });
      return;
    }

    // Focus/click handlers only stopEditing, so the row is still tracked here.
    // saveRow itself clears editingRows first, so button-triggered saves do not double-emit.
    this.saveRow(event.data);
  }

  onRowEditingStopped(event: RowEditingStoppedEvent<TData>): void {
    if (event.data && this.editingRows.has(event.data)) {
      // Same-row focus flicker can stop editors; reopen instead of exiting.
      if (this.isFocusOnEditingData(event.api, event.data)) {
        queueMicrotask(() => {
          if (this.editingRows.has(event.data!)) {
            this.startEditorsForRow(event.data!);
          }
        });
        return;
      }

      // No value changes — leave edit mode without emitting rowSaved.
      this.editSnapshots.delete(event.data);
      this.editingRows.delete(event.data);
    } else if (this.editingRows.size && event.api.getEditingCells().length === 0) {
      // Identity mismatch between event.data and the tracked row object.
      this.editingRows.clear();
      this.editSnapshots.clear();
    }

    this.refreshGrid();
  }

  onCellFocused(event: CellFocusedEvent<TData>): void {
    if (!this.enableActionButtons || !this.editingRows.size) {
      return;
    }

    const focused = event.api.getFocusedCell();
    // Ignore cleared-focus events; leaving the grid is handled separately.
    // Treating null as "left the row" falsely stops edit when clicking cells
    // in the same row (focus briefly clears before landing on the new cell).
    if (focused == null) {
      return;
    }

    const node = this.getRowNodeForFocus(event.api, focused.rowIndex, focused.rowPinned);
    for (const data of this.editingRows) {
      if (data !== node?.data) {
        // Let rowValueChanged / rowEditingStopped finish the save or cleanup.
        event.api.stopEditing(false);
        return;
      }
    }
  }

  onRowClicked(event: RowClickedEvent<TData>): void {
    if (!this.enableActionButtons || !event.data) {
      return;
    }

    const target = event.event?.target;
    if (target instanceof Element && target.closest('.ks-grid-action-cell, button[data-action], .ks-grid-row-actions')) {
      return;
    }

    // Already editing this row — keep editors open (same-row cell click).
    if (this.editingRows.has(event.data)) {
      return;
    }

    // Clicking a cell/row enters edit mode (and saves any other open edit).
    this.enterEditMode(event.data);
  }

  /**
   * Commit the open edit when keyboard focus leaves the grid for a focusable
   * target outside it. Clicks on non-focusable areas are handled by mousedown.
   */
  onGridFocusOut(event: FocusEvent): void {
    if (!this.enableActionButtons || !this.editingRows.size) {
      return;
    }

    const next = event.relatedTarget;
    if (!(next instanceof Node)) {
      return;
    }

    const gridRoot = this.agGridEl?.nativeElement;
    if (gridRoot?.contains(next)) {
      return;
    }

    this.agGrid?.api?.stopEditing(false);
  }

  /**
   * Commit the open edit when the user clicks outside the grid. Needed because
   * stopEditingWhenCellsLoseFocus also stops on same-row cell clicks (cells use
   * tabindex=-1 / null relatedTarget during mousedown).
   */
  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.enableActionButtons || !this.editingRows.size) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    const gridRoot = this.agGridEl?.nativeElement;
    if (!gridRoot || gridRoot.contains(target)) {
      return;
    }

    this.agGrid?.api?.stopEditing(false);
  }

  private getRowNodeForFocus(
    api: CellFocusedEvent<TData>['api'],
    rowIndex: number,
    rowPinned: string | null | undefined,
  ) {
    if (rowPinned === 'bottom') {
      return api.getPinnedBottomRow(rowIndex);
    }
    if (rowPinned === 'top') {
      return api.getPinnedTopRow(rowIndex);
    }
    return api.getDisplayedRowAtIndex(rowIndex);
  }

  private isFocusOnEditingData(
    api: CellFocusedEvent<TData>['api'],
    data: TData,
  ): boolean {
    const focused = api.getFocusedCell();
    if (focused == null) {
      return false;
    }
    return this.getRowNodeForFocus(api, focused.rowIndex, focused.rowPinned)?.data === data;
  }

  onEditEscape(): void {
    for (const data of this.editingRows) {
      this.cancelEdit(data);
    }
  }

  /**
   * Cancel editing, discard changes made since edit mode started, and exit edit mode.
   */
  cancelEdit(data: TData): void {
    this.editingRows.delete(data);
    // Discard the active editor before restoring, so it cannot commit over the snapshot.
    this.agGrid?.api?.stopEditing(true);
    this.restoreEditSnapshot(data);
    this.editSnapshots.delete(data);
    if (!this.useServerSideData && this.agGrid?.api) {
      this.agGrid.api.applyTransaction({ update: [data] });
    }
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
    this.editSnapshots.delete(data);

    // Emit the deletion event to parent before touching grid state.
    // Handlers often remove the row from the bound array synchronously, so the
    // grid removal below must not depend on the row's current array index.
    this.rowDeleted.emit(data);

    // Client-side rows are matched by object identity. AG Grid assigns its own
    // row ids (not the source-array index), so an index lookup skips the removal
    // whenever the row is missing from rowData or the array was already updated.
    if (!this.useServerSideData) {
      this.agGrid.api.applyTransaction({ remove: [data] });
    }
  }

  private captureEditSnapshot(data: TData): void {
    if (!data || typeof data !== 'object' || this.editSnapshots.has(data)) {
      return;
    }
    this.editSnapshots.set(data, { ...(data as Record<string, unknown>) });
  }

  private restoreEditSnapshot(data: TData): void {
    const snapshot = this.editSnapshots.get(data);
    if (!snapshot || !data || typeof data !== 'object') {
      return;
    }

    const record = data as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
        delete record[key];
      }
    }
    Object.assign(record, snapshot);
  }

  /**
   * Refresh action-button cell renderers without destroying open editors.
   */
  private refreshGrid(): void {
    this.agGrid?.api?.refreshCells({
      columns: ['ks-ag-grid-actions'],
      force: true,
    });
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

  /**
   * Refresh the grid data
   */
  refreshData(): void {
    if (this.agGrid?.api) {
      // If using server-side data, refresh the datasource
      if (this.useServerSideData && this.datasource) {
        // Objects set through the API always notify, so the same datasource reloads.
        this.agGrid.api.setGridOption('datasource', this.datasource);
      } else if (!this.useServerSideData && this.rowData) {
        // For client-side data, refresh the grid
        this.agGrid.api.refreshCells({ force: true });
        this.agGrid.api.redrawRows();
      }
    }
  }

}
