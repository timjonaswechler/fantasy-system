// src/config/data-table.ts
import { Pickaxe, SquareSquare } from "lucide-react";
import type { DataTableConfig } from "@/types";

export const dataTableConfig: DataTableConfig = {
  featureFlags: [
    {
      label: "Advanced table",
      value: "advancedTable",
      icon: Pickaxe,
      tooltipTitle: "Toggle advanced table",
      tooltipDescription: "A filter and sort builder to filter and sort rows.",
    },
    {
      label: "Floating bar",
      value: "floatingBar",
      icon: SquareSquare,
      tooltipTitle: "Toggle floating bar",
      tooltipDescription: "A floating bar that sticks to the top of the table.",
    },
  ],
  textOperators: [
    { label: "Contains", value: "iLike" },
    { label: "Does not contain", value: "notILike" },
    { label: "Is", value: "eq" },
    { label: "Is not", value: "ne" },
    { label: "Is empty", value: "isEmpty" },
    { label: "Is not empty", value: "isNotEmpty" },
  ],
  numericOperators: [
    { label: "Is", value: "eq" },
    { label: "Is not", value: "ne" },
    { label: "Is less than", value: "lt" },
    { label: "Is less than or equal to", value: "lte" },
    { label: "Is greater than", value: "gt" },
    { label: "Is greater than or equal to", value: "gte" },
    { label: "Is empty", value: "isEmpty" },
    { label: "Is not empty", value: "isNotEmpty" },
  ],
  dateOperators: [
    { label: "Is", value: "eq" },
    { label: "Is not", value: "ne" },
    { label: "Is before", value: "lt" },
    { label: "Is after", value: "gt" },
    { label: "Is on or before", value: "lte" },
    { label: "Is on or after", value: "gte" },
    { label: "Is between", value: "isBetween" },
    { label: "Is empty", value: "isEmpty" },
    { label: "Is not empty", value: "isNotEmpty" },
  ],
  selectOperators: [
    { label: "Is", value: "eq" },
    { label: "Is not", value: "ne" },
    { label: "Is empty", value: "isEmpty" },
    { label: "Is not empty", value: "isNotEmpty" },
  ],
  booleanOperators: [
    { label: "Is", value: "eq" },
    { label: "Is not", value: "ne" },
  ],
  joinOperators: [
    { label: "And", value: "and" },
    { label: "Or", value: "or" },
  ],
  sortOrders: [
    { label: "Asc", value: "asc" },
    { label: "Desc", value: "desc" },
  ],
  columnTypes: ["text", "number", "date", "boolean", "select", "multi-select"],
  globalOperators: [
    "iLike",
    "notILike",
    "eq",
    "ne",
    "isEmpty",
    "isNotEmpty",
    "lt",
    "lte",
    "gt",
    "gte",
    "isBetween",
    "isRelativeToToday",
  ],
};
