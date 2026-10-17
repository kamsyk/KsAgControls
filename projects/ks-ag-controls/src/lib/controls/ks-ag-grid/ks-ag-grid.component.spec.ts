import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgGridAngular } from 'ag-grid-angular';

import { KsAgGridComponent } from './ks-ag-grid.component';

interface GridRow {
  id: number;
  name: string;
  note?: string;
}

describe('KsAgGridComponent', () => {
  let component: KsAgGridComponent<GridRow>;
  let fixture: ComponentFixture<KsAgGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsAgGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KsAgGridComponent);
    component = fixture.componentInstance as KsAgGridComponent<GridRow>;
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

  function mockGridApi() {
    const api = {
      applyTransaction: vi.fn(() => ({ add: [], remove: [], update: [] })),
      getRowNode: vi.fn(() => undefined),
      refreshCells: vi.fn(),
      stopEditing: vi.fn(),
    };
    component.agGrid = { api } as unknown as AgGridAngular;
    return api;
  }

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

function stubGridApi(component: KsAgGridComponent) {
  const api = {
    applyTransaction: vi.fn().mockReturnValue({ remove: [{}], add: [], update: [] }),
    getRowNode: vi.fn().mockReturnValue(undefined),
    refreshCells: vi.fn(),
    stopEditing: vi.fn(),
  };
  component.agGrid = { api } as unknown as KsAgGridComponent['agGrid'];
  return api;
}
