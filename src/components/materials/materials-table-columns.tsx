"use client";

import {
  IMaterial,
  MaterialCategory,
  getCategoryColor,
} from "@/types/material";
import type { DataTableRowAction } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Ellipsis,
  Diamond,
  Box,
  Droplet,
  Leaf,
  Eye,
  Edit,
  Trash,
} from "lucide-react";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<IMaterial> | null>
  >;
  onViewMaterial?: (material: IMaterial) => void;
}

// Function to get material category icon
const getMaterialCategoryIcon = (category: MaterialCategory) => {
  switch (category) {
    case MaterialCategory.METAL:
      return Box;
    case MaterialCategory.GEM:
      return Diamond;
    case MaterialCategory.LIQUID:
      return Droplet;
    case MaterialCategory.ORGANIC:
      return Leaf;
    default:
      return Box;
  }
};

export function getColumns({
  setRowAction,
  onViewMaterial,
}: GetColumnsProps): ColumnDef<IMaterial>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 19,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <span className="max-w-[31.25rem] truncate font-medium">
              {row.getValue("name")}
            </span>
          </div>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <span className="max-w-[31.25rem] truncate text-sm text-muted-foreground">
              {row.getValue("description") || "N/A"}
            </span>
          </div>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = row.getValue("category") as MaterialCategory;
        const Icon = getMaterialCategoryIcon(category);
        const color = getCategoryColor(category);

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon
              className="mr-2 size-4 text-muted-foreground"
              aria-hidden="true"
              style={{ color }}
            />
            <Badge variant="outline" className="capitalize">
              {category}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      enableHiding: false,
    },
    {
      accessorKey: "hardness",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Hardness" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("hardness");
        const hardness = typeof value === "number" ? value : null;
        return (
          <div className="flex items-center">
            <span>{hardness !== null ? hardness : "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "density",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Density" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("density");
        const density = typeof value === "number" ? value : null;
        return (
          <div className="flex items-center">
            <span>{density !== null ? `${density} kg/m³` : "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "sharpness",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sharpness" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("sharpness");
        const sharpness = typeof value === "number" ? value : null;
        return (
          <div className="flex items-center">
            <span>{sharpness !== null ? sharpness : "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "durability",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Durability" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("durability");
        const durability = typeof value === "number" ? value : null;

        if (durability === null) return <span>N/A</span>;

        return (
          <div className="w-full">
            <div className="flex justify-between mb-1 text-xs">
              <span>{durability}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  durability > 75
                    ? "bg-emerald-500"
                    : durability > 50
                    ? "bg-amber-500"
                    : durability > 25
                    ? "bg-orange-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${durability}%` }}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "valueModifier",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("valueModifier");
        const numValue = typeof value === "number" ? value : 1;
        return (
          <div className="flex items-center">
            <span>×{numValue.toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "color",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Color" />
      ),
      cell: ({ row }) => {
        const color = row.getValue("color") as string;
        const colorHex = row.original.colorHex || "#888888";

        return (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: colorHex }}
            ></div>
            <span>{color || "N/A"}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="More options"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <Ellipsis className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onViewMaterial?.(row.original)}
                >
                  <Eye className="mr-2 size-4" aria-hidden="true" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRowAction({ row, type: "update" })}
                >
                  <Edit className="mr-2 size-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setRowAction({ row, type: "delete" })}
                  className="text-destructive"
                >
                  <Trash className="mr-2 size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 17,
      enableHiding: false,
    },
  ];
}
