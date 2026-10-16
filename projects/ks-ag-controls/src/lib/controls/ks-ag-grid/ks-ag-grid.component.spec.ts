import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsAgGridComponent } from './ks-ag-grid.component';

describe('KsAgGridComponent', () => {
  let component: KsAgGridComponent;
  let fixture: ComponentFixture<KsAgGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsAgGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KsAgGridComponent);
    component = fixture.componentInstance;
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

  it('reuses column definitions until the source or action mode changes', () => {
    const grid = component as KsAgGridComponent<{ name: string }>;
    grid.columnDefs = [{ field: 'name' }];
    grid.enableActionButtons = true;

    const first = grid.effectiveColumnDefs;
    expect(grid.effectiveColumnDefs).toBe(first);
    expect(grid.defaultColDef).toBe(grid.defaultColDef);
    expect(first[0].colId).toBe('ks-ag-grid-actions');

    grid.enableActionButtons = false;
    grid.enableRowDeletion = true;
    const withDelete = grid.effectiveColumnDefs;
    expect(withDelete).not.toBe(first);
    expect(withDelete[0].colId).toBe('ks-ag-grid-delete');
    expect(grid.effectiveColumnDefs).toBe(withDelete);
  });

  it('removes a client-side row by object identity when its index is not its row id', () => {
    const first = { id: 'a', name: 'kept' };
    const second = { id: 'b', name: 'gone' };
    component.rowData = [first, second];
    const api = stubGridApi(component);
    const deleted = vi.fn();
    component.rowDeleted.subscribe(deleted);

    component.deleteRow(second);

    expect(api.getRowNode).not.toHaveBeenCalled();
    expect(api.applyTransaction).toHaveBeenCalledWith({ remove: [second] });
    expect(deleted).toHaveBeenCalledWith(second);
  });

  it('removes a row that was added in the grid and is absent from rowData', () => {
    const added = { id: 'new', name: '' };
    component.rowData = [{ id: 'a', name: 'kept' }];
    const api = stubGridApi(component);

    component.deleteRow(added);

    expect(api.applyTransaction).toHaveBeenCalledWith({ remove: [added] });
  });

  it('does not apply a client-side remove for server-driven grids', () => {
    const row = { id: 'a' };
    component.useServerSideData = true;
    component.rowData = [row];
    const api = stubGridApi(component);

    component.deleteRow(row);

    expect(api.applyTransaction).not.toHaveBeenCalled();
  });

  it('restores the pre-edit snapshot when editing is cancelled', () => {
    const row: { name: string; role: string; extra?: boolean } = {
      name: 'Ada',
      role: 'admin',
    };
    const api = stubGridApi(component);

    component.enterEditMode(row);
    row.name = 'Grace';
    row.extra = true;
    component.enterEditMode(row);
    component.cancelEdit(row);

    expect(row).toEqual({ name: 'Ada', role: 'admin' });
    expect(api.stopEditing).toHaveBeenCalledWith(true);
    expect(api.refreshCells).toHaveBeenCalledWith({ force: true });
  });

  it('keeps edited values when the row is saved', () => {
    const row = { name: 'Ada' };
    const api = stubGridApi(component);
    const saved = vi.fn();
    component.rowSaved.subscribe(saved);

    component.enterEditMode(row);
    row.name = 'Grace';
    component.saveRow(row);

    expect(row).toEqual({ name: 'Grace' });
    expect(saved).toHaveBeenCalledWith(row);
    expect(api.stopEditing).toHaveBeenCalledWith(false);
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
