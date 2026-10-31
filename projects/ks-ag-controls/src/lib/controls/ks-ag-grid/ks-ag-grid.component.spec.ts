import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, CellClickedEvent, IGetRowsParams, ModuleRegistry } from 'ag-grid-community';

import { KsAgGridComponent } from './ks-ag-grid.component';

ModuleRegistry.registerModules([AllCommunityModule]);

interface GridRow {
  id: number;
  name: string;
  note?: string;
}

describe('KsAgGridComponent', () => {
  let component: KsAgGridComponent<GridRow>;
  let fixture: ComponentFixture<KsAgGridComponent>;

  beforeEach(async () => {
    vi.stubGlobal('alert', vi.fn());
    await TestBed.configureTestingModule({
      imports: [KsAgGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KsAgGridComponent);
    component = fixture.componentInstance as KsAgGridComponent<GridRow>;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the save settings icon from the local SVG pool', () => {
    fixture.componentRef.setInput('enableSettingsPersistence', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const icon = host.querySelector('.grid-toolbar button lib-ks-icon svg');
    expect(icon?.getAttribute('viewBox')).toBe('0 -960 960 960');
    expect(icon?.querySelector('path')?.getAttribute('d')).toBeTruthy();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.getAttribute('focusable')).toBe('false');
  });

  it('should use light theme mode by default', () => {
    expect(component.gridClass).toBe('ag-theme-quartz');
  });

  it('keeps individual-cell editing when action buttons are disabled', () => {
    fixture.componentRef.setInput('enableEditing', true);
    fixture.detectChanges();
    expect(component.agGrid.editType).toBeUndefined();
    expect(component.agGrid.defaultColDef).toBe(component.defaultColDef);
  });

  it('should use dark theme mode when themeMode is dark', () => {
    component.themeMode = 'dark';
    fixture.detectChanges();

    expect(component.gridClass).toBe('ag-theme-quartz-dark');
  });

  it('should preserve custom grid classes with the selected theme', () => {
    component.themeMode = 'dark';
    component.class = 'custom-grid';
    fixture.detectChanges();

    expect(component.gridClass).toBe('ag-theme-quartz-dark custom-grid');
  });

  it('keeps the toolbar optional and updates the entire shell when the theme changes', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.grid-toolbar')).toBeNull();
    expect(host.querySelector('.grid-shell--dark')).toBeNull();

    fixture.componentRef.setInput('enableSettingsPersistence', true);
    fixture.componentRef.setInput('themeMode', 'dark');
    fixture.detectChanges();

    expect(host.querySelector('.grid-toolbar')).not.toBeNull();
    expect(host.querySelector('.grid-shell--dark')).not.toBeNull();
    expect(host.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Grid settings');

    fixture.componentRef.setInput('themeMode', 'light');
    fixture.detectChanges();
    expect(host.querySelector('.grid-shell--dark')).toBeNull();
  });

  it('renders labeled toolbar buttons with icons and preserves their handlers', () => {
    const save = vi.spyOn(component, 'saveSettings').mockImplementation(() => undefined);
    const clear = vi.spyOn(component, 'clearSettings').mockImplementation(() => undefined);
    const add = vi.spyOn(component, 'addNewItem').mockImplementation(() => undefined);
    fixture.componentRef.setInput('enableSettingsPersistence', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const buttons = host.querySelectorAll<HTMLButtonElement>('.grid-toolbar button');
    expect(Array.from(buttons, (button) => button.textContent?.trim())).toEqual([
      'Save Settings', 'Clear Settings', 'Add New Item',
    ]);
    for (const button of buttons) {
      expect(button.type).toBe('button');
      expect(button.querySelector('svg')).not.toBeNull();
      button.click();
    }
    expect(save).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
    expect(add).toHaveBeenCalledOnce();
  });

  function actionColumn(deleteOnly = false) {
    component.columnDefs = [{ field: 'name' }];
    component.enableActionButtons = !deleteOnly;
    component.enableRowDeletion = deleteOnly;
    return component.effectiveColumnDefs[0];
  }

  function renderActions(row?: GridRow, deleteOnly = false) {
    const column = actionColumn(deleteOnly);
    const renderer = column.cellRenderer as (params: { data?: GridRow }) => string;
    const cell = document.createElement('div');
    cell.className = 'ag-cell';
    cell.tabIndex = 0;
    cell.innerHTML = renderer({ data: row });
    return { cell, column };
  }

  function clickAction(target: Element | null, deleteOnly = false) {
    if (!target) throw new Error('Expected an action target');
    const { column } = renderActions(undefined, deleteOnly);
    const mouseEvent = new MouseEvent('click');
    Object.defineProperty(mouseEvent, 'target', { value: target });
    const onClick = column.onCellClicked as (
      params: Pick<CellClickedEvent<GridRow>, 'data' | 'event'>
    ) => void;
    onClick({ data: actionRow, event: mouseEvent });
  }

  const actionRow: GridRow = { id: 1, name: 'Ada' };

  it('renders compact edit/delete icons with accessible names and no visible text', () => {
    const { cell, column } = renderActions(actionRow);
    expect(column.width).toBe(104);
    expect(column.flex).toBe(0);
    const rendererOptions = column.cellRendererParams as { suppressMouseEventHandling(): boolean };
    expect(rendererOptions.suppressMouseEventHandling()).toBe(true);
    const buttons = cell.querySelectorAll<HTMLButtonElement>('button');
    expect(Array.from(buttons, (button) => button.getAttribute('aria-label')))
      .toEqual(['Edit row', 'Delete row']);
    for (const button of buttons) {
      expect(button.type).toBe('button');
      expect(button.title).toBe(button.getAttribute('aria-label'));
      expect(button.textContent?.trim()).toBe('');
      expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(button.querySelector('svg')?.getAttribute('focusable')).toBe('false');
      expect(button.querySelector('path')?.getAttribute('d')).toBeTruthy();
    }
  });

  it('renders save/cancel icons in edit mode and returns to edit/delete after cancelling', () => {
    stubGridApi(component);
    component.enterEditMode(actionRow);
    let { cell } = renderActions(actionRow);
    expect(Array.from(cell.querySelectorAll('button'), (button) => button.getAttribute('aria-label')))
      .toEqual(['Save row', 'Cancel editing']);
    component.cancelEdit(actionRow);
    ({ cell } = renderActions(actionRow));
    expect(cell.querySelector('[data-action="edit"]')).not.toBeNull();
    expect(cell.querySelector('[data-action="save"]')).toBeNull();
  });

  it('renders a single icon in deletion-only mode and no actions for loading rows', () => {
    const { cell, column } = renderActions(actionRow, true);
    expect(column.width).toBe(72);
    expect(cell.querySelectorAll('button')).toHaveLength(1);
    expect(cell.querySelector('button')?.getAttribute('aria-label')).toBe('Delete row');
    expect(renderActions().cell.innerHTML).toBe('');
    expect(renderActions(undefined, true).cell.innerHTML).toBe('');
  });

  it.each([
    ['edit', 'enterEditMode'],
    ['save', 'saveRow'],
    ['cancel', 'cancelEdit'],
    ['delete', 'deleteRow'],
  ] as const)('dispatches %s from a nested SVG path', (action, method) => {
    const handler = vi.spyOn(component, method).mockImplementation(() => undefined);
    const { cell } = renderActions(actionRow);
    if (action === 'save' || action === 'cancel') {
      mockGridApi();
      component.enterEditMode(actionRow);
      cell.innerHTML = renderActions(actionRow).cell.innerHTML;
    }
    clickAction(cell.querySelector(`[data-action="${action}"] path`));
    expect(handler).toHaveBeenCalledWith(actionRow);
  });

  it('deletes only when its icon button is activated, not when cell whitespace is clicked', () => {
    const handler = vi.spyOn(component, 'deleteRow').mockImplementation(() => undefined);
    const { cell } = renderActions(actionRow, true);
    clickAction(cell, true);
    expect(handler).not.toHaveBeenCalled();
    clickAction(cell.querySelector('svg'), true);
    expect(handler).toHaveBeenCalledWith(actionRow);
  });

  it('keeps focus in the action cell when refreshing replaces the activated button', () => {
    mockGridApi();
    const { cell } = renderActions(actionRow);
    component.enterEditMode(actionRow);
    cell.innerHTML = renderActions(actionRow).cell.innerHTML;
    const saveButton = cell.querySelector<HTMLButtonElement>('[data-action="save"]')!;
    vi.spyOn(component, 'saveRow').mockImplementation(() => {
      cell.innerHTML = '';
    });
    document.body.appendChild(cell);
    try {
      saveButton.focus();
      clickAction(saveButton.querySelector('path'));
      expect(document.activeElement).toBe(cell);
    } finally {
      cell.remove();
    }
  });

  it('lets Tab move between icon buttons and native Enter/Space activate them', () => {
    const { cell, column } = renderActions(actionRow);
    const buttons = cell.querySelectorAll('button');
    const suppress = column.suppressKeyboardEvent as (params: { event: KeyboardEvent }) => boolean;
    const isSuppressed = (target: Element, key: string, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key, shiftKey });
      Object.defineProperty(event, 'target', { value: target });
      return suppress({ event });
    };
    expect(isSuppressed(cell, 'Tab')).toBe(true);
    expect(isSuppressed(buttons[0], 'Tab')).toBe(true);
    expect(isSuppressed(buttons[1], 'Tab')).toBe(false);
    expect(isSuppressed(buttons[1], 'Tab', true)).toBe(true);
    expect(isSuppressed(buttons[0], 'Tab', true)).toBe(false);
    expect(isSuppressed(buttons[0], 'Enter')).toBe(true);
    expect(isSuppressed(buttons[0], ' ')).toBe(true);
    expect(isSuppressed(cell, 'Enter')).toBe(false);
    expect(isSuppressed(buttons[0], 'ArrowRight')).toBe(false);
  });

  function mockGridApi() {
    const api = {
      applyTransaction: vi.fn(() => ({ add: [], remove: [], update: [] })),
      getRowNode: vi.fn(() => undefined),
      refreshCells: vi.fn(),
      redrawRows: vi.fn(),
      stopEditing: vi.fn(),
      forEachNode: vi.fn(),
    };
    component.agGrid = { api } as unknown as AgGridAngular;
    return api;
  }

  it('opens every editable cell when Edit is clicked, and commits or cancels the row', async () => {
    const row: GridRow = { id: 1, name: 'Ada', note: 'Original' };
    fixture.componentRef.setInput('rowData', [row]);
    fixture.componentRef.setInput('columnDefs', [
      { field: 'id', editable: false },
      { field: 'name' },
      { field: 'note' },
    ]);
    fixture.componentRef.setInput('enableActionButtons', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => {
      expect(host.querySelector('[data-action="edit"]')).not.toBeNull();
    });
    const api = component.agGrid.api;
    expect(api.getEditingCells()).toHaveLength(0);

    host.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
    await vi.waitFor(() => {
      expect(api.getEditingCells().map((cell) => cell.column?.getColId())).toEqual(['name', 'note']);
    });
    await vi.waitFor(() => {
      expect(host.querySelector('[data-action="save"]')).not.toBeNull();
      expect(host.querySelector('[data-action="cancel"]')).not.toBeNull();
      expect(host.querySelector('[data-action="edit"]')).toBeNull();
    });
    const nameInput = host.querySelector<HTMLInputElement>('[col-id="name"] input')!;
    expect(nameInput).not.toBeNull();
    expect(host.querySelector('[col-id="id"] input')).toBeNull();
    expect(document.activeElement).toBe(nameInput);
    nameInput.value = 'Grace';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    const saved = vi.fn();
    component.rowSaved.subscribe(saved);
    host.querySelector<HTMLButtonElement>('[data-action="save"]')!.click();
    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(0));
    expect(row.name).toBe('Grace');
    expect(saved).toHaveBeenCalledWith(row);

    host.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(2));
    const editInput = host.querySelector<HTMLInputElement>('[col-id="name"] input')!;
    editInput.value = 'Discarded';
    editInput.dispatchEvent(new Event('input', { bubbles: true }));
    host.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.click();
    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(0));
    expect(row.name).toBe('Grace');
    expect(saved).toHaveBeenCalledOnce();

    component.addNewItem();
    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(2));
    expect(api.getEditingCells().every((cell) => cell.rowIndex === 0)).toBe(true);
    api.stopEditing(true);
  });

  it('opens the requested row at its displayed index after sorting', async () => {
    const row: GridRow = { id: 1, name: 'Zoe' };
    fixture.componentRef.setInput('rowData', [row, { id: 2, name: 'Ada' }]);
    fixture.componentRef.setInput('columnDefs', [
      { field: 'id', editable: false },
      { field: 'name', sort: 'asc' },
      { field: 'note', editable: () => false },
    ]);
    fixture.componentRef.setInput('enableActionButtons', true);
    fixture.detectChanges();
    const api = component.agGrid.api;
    await vi.waitFor(() => expect(api.getDisplayedRowAtIndex(1)?.data).toBe(row));

    component.enterEditMode(row);

    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(1));
    expect(api.getEditingCells()[0].rowIndex).toBe(1);
    expect(api.getEditingCells()[0].column?.getColId()).toBe('name');
    component.cancelEdit(row);
  });

  async function prepareRowExitTest(serverSide = false) {
    const row: GridRow = { id: 1, name: 'Ada', note: 'Original' };
    const otherRow: GridRow = { id: 2, name: 'Grace' };
    fixture.componentRef.setInput('rowData', [row, otherRow]);
    if (serverSide) {
      fixture.componentRef.setInput('useServerSideData', true);
      fixture.componentRef.setInput('serverDataSource', {
        getRows: (params: IGetRowsParams) => params.successCallback([row, otherRow], 2),
      });
    }
    fixture.componentRef.setInput('columnDefs', [{ field: 'name' }, { field: 'note' }]);
    fixture.componentRef.setInput('enableActionButtons', true);
    fixture.detectChanges();
    const api = component.agGrid.api;
    await vi.waitFor(() => expect(api.getDisplayedRowAtIndex(0)?.data).toBe(row));
    component.enterEditMode(row);
    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(2));
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('[col-id="name"] input')!;
    input.value = 'Updated';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const saved = vi.fn();
    component.rowSaved.subscribe(saved);
    return { row, api, host, input, saved };
  }

  it('publishes the committed values, not the pre-edit values, when leaving a row', async () => {
    const { api, saved } = await prepareRowExitTest();
    const payloads: string[] = [];
    component.rowSaved.subscribe((data) => payloads.push(JSON.stringify(data)));

    api.setFocusedCell(1, 'name');

    await vi.waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(payloads).toEqual([JSON.stringify({ id: 1, name: 'Updated', note: 'Original' })]);
  });

  it.each([false, true])('saves once on row exit (server-side data: %s)', async (serverSide) => {
    const { row, api, host, saved } = await prepareRowExitTest(serverSide);
    const saveRow = vi.spyOn(component, 'saveRow');

    api.setFocusedCell(1, 'name');

    await vi.waitFor(() => expect(saved).toHaveBeenCalledExactlyOnceWith(row));
    expect(saveRow).toHaveBeenCalledExactlyOnceWith(row);
    expect(row.name).toBe('Updated');
    expect(api.getEditingCells()).toHaveLength(0);
    expect(host.querySelector('[data-action="save"]')).toBeNull();
    expect(host.querySelectorAll('[data-action="edit"]')).toHaveLength(2);
  });

  it.each([false, true])('calls saveRow when another row is clicked without a focus change (server-side data: %s)', async (serverSide) => {
    const { row, api, host, saved } = await prepareRowExitTest(serverSide);
    const saveRow = vi.spyOn(component, 'saveRow');
    const payloads: string[] = [];
    component.rowSaved.subscribe((data) => payloads.push(JSON.stringify(data)));
    const cell = host.querySelector<HTMLElement>('.ag-row[row-index="1"] [col-id="name"]')!;

    // A click without mousedown leaves grid focus unchanged.
    cell.click();

    await vi.waitFor(() => expect(saved).toHaveBeenCalledExactlyOnceWith(row));
    expect(saveRow).toHaveBeenCalledWith(row);
    expect(payloads).toEqual([JSON.stringify({ id: 1, name: 'Updated', note: 'Original' })]);
    expect(api.getEditingCells()).toHaveLength(0);
    expect(host.querySelector('[data-action="save"]')).toBeNull();
  });

  it('keeps editing when the same row is clicked without a focus change', async () => {
    const { row, api, host, saved } = await prepareRowExitTest();
    const saveRow = vi.spyOn(component, 'saveRow');

    host.querySelector<HTMLElement>('.ag-row[row-index="0"] [col-id="note"]')!.click();

    await fixture.whenStable();
    expect(saveRow).not.toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
    expect(api.getEditingCells()).toHaveLength(2);
    component.cancelEdit(row);
  });

  it.each([false, true])('saves when focus leaves the grid (server-side data: %s)', async (serverSide) => {
    const { row, api, host, saved } = await prepareRowExitTest(serverSide);
    const saveRow = vi.spyOn(component, 'saveRow');
    const outside = document.createElement('button');
    document.body.append(outside);
    try {
      outside.focus();

      await vi.waitFor(() => expect(saved).toHaveBeenCalledExactlyOnceWith(row));
      expect(saveRow).toHaveBeenCalledExactlyOnceWith(row);
      expect(row.name).toBe('Updated');
      expect(api.getEditingCells()).toHaveLength(0);
      expect(host.querySelector('[data-action="save"]')).toBeNull();
    } finally {
      outside.remove();
    }
  });

  it('keeps editing when focus moves between cells in the same row', async () => {
    const { api, host, saved } = await prepareRowExitTest();

    host.querySelector<HTMLInputElement>('[col-id="note"] input')!.focus();
    api.setFocusedCell(0, 'note');
    await fixture.whenStable();

    expect(saved).not.toHaveBeenCalled();
    expect(api.getEditingCells()).toHaveLength(2);
    component.cancelEdit(api.getDisplayedRowAtIndex(0)!.data);
  });

  it('discards edits without saving when Escape is pressed', async () => {
    const { row, api, input, saved } = await prepareRowExitTest();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(0));
    await fixture.whenStable();
    expect(saved).not.toHaveBeenCalled();
    expect(row.name).toBe('Ada');
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-action="save"]')).toBeNull();
  });

  it('saves the previous row once when another row enters edit mode', async () => {
    const { row, api, saved } = await prepareRowExitTest();
    const otherRow: GridRow = api.getDisplayedRowAtIndex(1)!.data;

    component.enterEditMode(otherRow);

    await vi.waitFor(() => {
      expect(saved).toHaveBeenCalledExactlyOnceWith(row);
      expect(api.getEditingCells()).toHaveLength(2);
      expect(api.getEditingCells().every((cell) => cell.rowIndex === 1)).toBe(true);
    });
    expect(row.name).toBe('Updated');
    component.cancelEdit(otherRow);
    await fixture.whenStable();
    expect(saved).toHaveBeenCalledOnce();
  });

  it('does not auto-save before the Cancel button can discard changes', async () => {
    const { row, api, host, saved } = await prepareRowExitTest();
    const cancel = host.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;

    cancel.focus();
    cancel.click();

    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(0));
    await fixture.whenStable();
    expect(row.name).toBe('Ada');
    expect(saved).not.toHaveBeenCalled();
    expect(host.querySelector('[data-action="save"]')).toBeNull();
  });

  it('saves a pinned new row on exit without confusing its index with a normal row', async () => {
    const { row, api, saved } = await prepareRowExitTest();
    component.cancelEdit(row);
    await fixture.whenStable();
    const newRow: GridRow = { id: 0, name: '' };
    api.setGridOption('pinnedBottomRowData', [newRow]);
    component.enterEditMode(newRow);
    api.setFocusedCell(0, 'name', 'bottom');
    api.startEditingCell({ rowIndex: 0, colKey: 'name', rowPinned: 'bottom' });
    await vi.waitFor(() => expect(api.getEditingCells()).toHaveLength(2));
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('.ag-row-pinned [col-id="name"] input')!;
    input.value = 'New row';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(saved).not.toHaveBeenCalled();

    saved.mockClear();
    api.setFocusedCell(0, 'name');

    await vi.waitFor(() => expect(saved).toHaveBeenCalledWith(newRow));
    expect(saved).toHaveBeenCalledTimes(1);
    expect(newRow.name).toBe('New row');
    expect(api.getEditingCells()).toHaveLength(0);
  });

  it('removes a client-side row by identity after the parent already spliced it out', () => {
    const api = mockGridApi();
    const first: GridRow = { id: 1, name: 'first' };
    const second: GridRow = { id: 2, name: 'second' };
    component.rowData = [first, second];
    const deleted: GridRow[] = [];
    component.rowDeleted.subscribe((row) => {
      deleted.push(row);
      const index = component.rowData!.indexOf(row);
      if (index >= 0) {
        component.rowData!.splice(index, 1);
      }
    });

    component.deleteRow(first);
    component.deleteRow(second);

    expect(deleted).toEqual([first, second]);
    expect(component.rowData).toEqual([]);
    expect(api.getRowNode).not.toHaveBeenCalled();
    expect(api.applyTransaction).toHaveBeenNthCalledWith(1, { remove: [first] });
    expect(api.applyTransaction).toHaveBeenNthCalledWith(2, { remove: [second] });
  });

  it('removes a newly added row that is not in the bound rowData array', () => {
    const api = mockGridApi();
    const existing: GridRow = { id: 1, name: 'existing' };
    const added: GridRow = { id: 2, name: 'added' };
    component.rowData = [existing];

    component.deleteRow(added);

    expect(component.rowData!.indexOf(added)).toBe(-1);
    expect(api.applyTransaction).toHaveBeenCalledWith({ remove: [added] });
  });

  it('does not apply a client-side transaction when deleting server-side rows', () => {
    const api = mockGridApi();
    const row: GridRow = { id: 1, name: 'remote' };
    component.rowData = [row];
    component.useServerSideData = true;
    const deleted: GridRow[] = [];
    component.rowDeleted.subscribe((value) => deleted.push(value));

    component.deleteRow(row);

    expect(deleted).toEqual([row]);
    expect(api.applyTransaction).not.toHaveBeenCalled();
  });

  it('restores the original row when editing is cancelled and keeps saved edits', () => {
    const api = mockGridApi();
    const row: GridRow = { id: 1, name: 'Ada' };
    const saved: GridRow[] = [];
    component.rowSaved.subscribe((value) => saved.push(value));

    component.enterEditMode(row);
    row.name = 'Grace';
    row.note = 'temporary';
    component.cancelEdit(row);

    expect(row).toEqual({ id: 1, name: 'Ada' });
    expect(saved).toEqual([]);
    expect(api.stopEditing).toHaveBeenCalledWith(true);
    expect(api.applyTransaction).toHaveBeenCalledWith({ update: [row] });

    component.enterEditMode(row);
    row.name = 'Grace';
    component.saveRow(row);

    expect(row.name).toBe('Grace');
    expect(saved).toEqual([row]);
    expect(api.stopEditing).toHaveBeenLastCalledWith(false);
  });

  it('does not replace an edit snapshot if edit mode starts again before save or cancel', () => {
    mockGridApi();
    const row: GridRow = { id: 1, name: 'Ada' };
    component.enterEditMode(row);
    row.name = 'Grace';
    component.enterEditMode(row);
    component.cancelEdit(row);

    expect(row.name).toBe('Ada');
  });

  it('keeps column definition identity stable across change detection', () => {
    component.columnDefs = [{ field: 'name' }];
    component.enableActionButtons = true;
    const first = component.effectiveColumnDefs;
    const firstDefault = component.defaultColDef;

    expect(component.effectiveColumnDefs).toBe(first);
    expect(component.defaultColDef).toBe(firstDefault);
    expect(first[0].headerName).toBe('Actions');

    const row: GridRow = { id: 1, name: 'Ada' };
    const editable = firstDefault.editable as (params: { data?: unknown }) => boolean;
    expect(editable({ data: row })).toBe(false);
    mockGridApi();
    component.enterEditMode(row);
    expect(component.effectiveColumnDefs).toBe(first);
    expect(editable({ data: row })).toBe(true);

    component.columnDefs = [{ field: 'name' }, { field: 'id' }];
    expect(component.effectiveColumnDefs).not.toBe(first);
    expect(component.effectiveColumnDefs).toHaveLength(3);
  });
});

function stubGridApi<TData>(component: KsAgGridComponent<TData>) {
  const api = {
    applyTransaction: vi.fn().mockReturnValue({ remove: [{}], add: [], update: [] }),
    getRowNode: vi.fn().mockReturnValue(undefined),
    refreshCells: vi.fn(),
    redrawRows: vi.fn(),
    stopEditing: vi.fn(),
    forEachNode: vi.fn(),
  };
  component.agGrid = { api } as unknown as KsAgGridComponent['agGrid'];
  return api;
}
