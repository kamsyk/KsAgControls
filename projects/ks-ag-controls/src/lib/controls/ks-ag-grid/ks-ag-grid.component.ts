import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ClientSideRowModelModule,
  ColDef,
  Module,
  Theme,
  themeQuartz,
} from 'ag-grid-community';

@Component({
  selector: 'lib-ks-ag-grid',
  imports: [AgGridAngular],
  templateUrl: './ks-ag-grid.component.html',
  styleUrl: './ks-ag-grid.component.css',
  standalone: true,
})
export class KsAgGridComponent {
  @Input() rowData: Record<string, unknown>[] | null = [];

  readonly theme: Theme = themeQuartz;
  readonly modules: Module[] = [ClientSideRowModelModule];
  readonly columnDefs: ColDef[] = [
    { field: 'sport' },
    { field: 'athlete' },
    { field: 'country' },
    { field: 'gold', type: 'numericColumn' },
  ];
  readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true,
  };
  loading = false;

}
