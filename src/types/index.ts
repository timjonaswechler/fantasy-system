// src/types/index.ts
import type {
  Table as TanstackTable,
  ColumnSort,
  Row,
} from "@tanstack/react-table";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type StringKeyOf<TData> = Extract<keyof TData, string>;

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: StringKeyOf<TData>;
}

export type ExtendedSortingState<TData> = ExtendedColumnSort<TData>[];

export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multi-select";

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "iLike"
  | "notILike"
  | "isEmpty"
  | "isNotEmpty"
  | "isBetween"
  | "isRelativeToToday";

export type JoinOperator = "and" | "or";

export interface DataTableFilterField<TData> {
  id: StringKeyOf<TData> | string;
  label: string;
  placeholder?: string;
  options?: Option[];
}

export interface DataTableAdvancedFilterField<TData>
  extends DataTableFilterField<TData> {
  type: ColumnType;
}

export interface Filter<TData> {
  id: StringKeyOf<TData> | string;
  value: string | string[];
  type: ColumnType;
  operator: FilterOperator;
  rowId: string;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  type: "update" | "delete";
}

// Configuration type for the DataTable's feature flags
export interface DataTableFeatureFlag {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltipTitle: string;
  tooltipDescription: string;
}

// Configuration type for the data table
export interface DataTableConfig {
  featureFlags: DataTableFeatureFlag[];
  textOperators: { label: string; value: FilterOperator }[];
  numericOperators: { label: string; value: FilterOperator }[];
  dateOperators: { label: string; value: FilterOperator }[];
  selectOperators: { label: string; value: FilterOperator }[];
  booleanOperators: { label: string; value: FilterOperator }[];
  joinOperators: { label: string; value: JoinOperator }[];
  sortOrders: { label: string; value: "asc" | "desc" }[];
  columnTypes: ColumnType[];
  globalOperators: FilterOperator[];
}
