import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import {
  ClientSideRowModelModule,
  ColDef,
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

@Component({
  selector: 'lib-ks-ag-grid',
  imports: [AgGridModule],
  templateUrl: './ks-ag-grid.component.html',
  styleUrl: './ks-ag-grid.component.css',
  standalone: true,
})
export class KsAgGridComponent<TData = unknown> implements OnInit, OnChanges {
  @Input() rowData: TData[] | null | undefined = [];
  @Input() columnDefs: ColDef<TData>[] | null = [];
  @Input() class: string | null = null;
  @Input() style: string | null = null;
  @Input() pageSize = 25;

  // Uses Infinite Row Model (AG Grid Community) for server-driven sorting and filtering.
  @Input() useServerSideData = false;
  @Input() serverDataSource?: IDatasource;
  @Input() serverDataService?: KsAgGridServerDataService<TData>;
  @Input() fetchServerRows?: KsAgGridServerRowsFetcher<TData>;

  readonly theme: Theme = themeQuartz;
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
    return this.class ? `ag-theme-quartz ${this.class}` : 'ag-theme-quartz';
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

}
