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
});
