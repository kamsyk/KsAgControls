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
export class KsAgGridComponent<TData = unknown> {
  @Input() rowData: TData[] | null | undefined = [];
  @Input() columnDefs: ColDef<TData>[] | null = [];
  @Input() class: string | null = null;
  @Input() style: string | null = null;

  readonly theme: Theme = themeQuartz;
  readonly modules: Module[] = [ClientSideRowModelModule];
  readonly defaultColDef: ColDef<TData> = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true,
  };
  loading = false;

}
