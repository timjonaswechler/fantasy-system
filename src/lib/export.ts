// Add this function to src/lib/export.ts

import type { Table } from "@tanstack/react-table";

/**
 * Exports table data to JSON file and triggers download
 */
export function exportTableToJSON<TData>(
  /**
   * The table to export.
   * @type Table<TData>
   */
  table: Table<TData>,
  opts: {
    /**
     * The filename for the JSON file.
     * @default "export"
     * @example "weapons"
     */
    filename?: string;
    /**
     * The columns to exclude from the JSON file.
     * @default []
     * @example ["select", "actions"]
     */
    excludeColumns?: (keyof TData | "select" | "actions")[];

    /**
     * Whether to export only the selected rows.
     * @default false
     */
    onlySelected?: boolean;
  } = {}
): void {
  const {
    filename = "export",
    excludeColumns = [],
    onlySelected = true,
  } = opts;

  // Get columns to include in export
  const columns = table
    .getAllLeafColumns()
    .filter(
      (column) =>
        !excludeColumns.includes(
          column.id as keyof TData | "select" | "actions"
        )
    )
    .map((column) => column.id);

  // Get rows based on selection option
  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getRowModel().rows;

  // Create JSON data
  const jsonData = rows.map((row) => {
    const rowData: Record<string, any> = {};

    columns.forEach((columnId) => {
      let value = row.getValue(columnId);

      // Ensure weight values are numbers, not strings
      if (columnId === "weight" && Array.isArray(value)) {
        value = value.map((item) =>
          typeof item === "string" ? parseFloat(item) : item
        );
      }

      // Ensure baseDamage values are numbers
      if (columnId === "baseDamage" && Array.isArray(value)) {
        value = value.map((item) =>
          typeof item === "string" ? parseInt(item, 10) : item
        );
      }

      rowData[columnId] = value;
    });

    return rowData;
  });

  // Create and download file
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
