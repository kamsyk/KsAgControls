import { Component, Input } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import {
  ClientSideRowModelModule,
  ColDef,
  Module,
  Theme,
  themeQuartz,
} from 'ag-grid-community';

@Component({
  selector: 'lib-ks-ag-grid',
  imports: [AgGridModule],
  templateUrl: './ks-ag-grid.component.html',
  styleUrl: './ks-ag-grid.component.css',
  standalone: true,
})
export class KsAgGridComponent {
  @Input() rowData: Record<string, unknown>[] | null = [];
  @Input() columnDefs: ColDef[] | null = [];

  readonly theme: Theme = themeQuartz;
  readonly modules: Module[] = [ClientSideRowModelModule];
  readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true,
  };
  loading = false;

}
