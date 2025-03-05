// src/components/materials/materials-table-columns.tsx
"use client";

import { IMaterial } from "@/types/material";
import type { DataTableRowAction } from "@/types/index";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Ellipsis,
  InspectionPanel,
  MountainSnow,
  Gem,
  Diamond,
  Trash,
  Edit,
  Eye,
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
import { MaterialCategory } from "@/types/material";
import { calculateMaterialQuality } from "@/lib/material-utils";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<IMaterial> | null>
  >;
  onViewMaterial: (material: IMaterial) => void;
}
// Funktion zum Abrufen eines Icons basierend auf der Materialkategorie
const getMaterialCategoryIcon = (category: MaterialCategory) => {
  switch (category) {
    case MaterialCategory.METAL:
      return InspectionPanel;
    case MaterialCategory.STONE:
      return MountainSnow;
    case MaterialCategory.GEM:
      return Gem;
    default:
      return Diamond;
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
        <DataTableColumnHeader column={column} title="Beschreibung" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <span className="max-w-[31.25rem] truncate text-sm text-muted">
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
        <DataTableColumnHeader column={column} title="Kategorie" />
      ),
      cell: ({ row }) => {
        const category = row.original.category;
        const Icon = getMaterialCategoryIcon(category);

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon
              className="mr-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="capitalize">{category}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      enableHiding: false,
    },
    {
      accessorKey: "density",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dichte (kg/m³)" />
      ),
      cell: ({ row }) => {
        const density = row.original.density;
        return (
          <div className="flex items-center">
            <span>{density.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "impactFracture",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bruchfestigkeit" />
      ),
      cell: ({ row }) => {
        const impactFracture = row.original.impactFracture;
        return (
          <div className="flex items-center">
            <span>{impactFracture.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "valueModifier",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Wertmod." />
      ),
      cell: ({ row }) => {
        const valueModifier = row.original.valueModifier;
        return (
          <div className="flex items-center">
            <span>×{valueModifier.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "quality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Qualität" />
      ),
      cell: ({ row }) => {
        const quality = calculateMaterialQuality(row.original);

        // Farbe basierend auf Qualität
        let colorClass = "bg-red-500";
        if (quality >= 80) colorClass = "bg-green-500";
        else if (quality >= 60) colorClass = "bg-lime-500";
        else if (quality >= 40) colorClass = "bg-yellow-500";
        else if (quality >= 20) colorClass = "bg-orange-500";

        return (
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`}></div>
            <span>{quality.toFixed(0)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "isMetal",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ist Metall" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.isMetal ? "Ja" : "Nein"}</span>;
      },
      enableHiding: true,
      meta: {
        filterVariant: "checkbox",
      },
    },
    {
      accessorKey: "isStone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ist Stein" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.isStone ? "Ja" : "Nein"}</span>;
      },
      enableHiding: true,
      meta: {
        filterVariant: "checkbox",
      },
    },
    {
      accessorKey: "isGem",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ist Edelstein" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.isGem ? "Ja" : "Nein"}</span>;
      },
      enableHiding: true,
      meta: {
        filterVariant: "checkbox",
      },
    },
    {
      accessorKey: "isOrganic",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ist Organisch" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.isOrganic ? "Ja" : "Nein"}</span>;
      },
      enableHiding: true,
      meta: {
        filterVariant: "checkbox",
      },
    },
    {
      accessorKey: "isFabric",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ist Stoff" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.isFabric ? "Ja" : "Nein"}</span>;
      },
      enableHiding: true,
      meta: {
        filterVariant: "checkbox",
      },
    },
    {
      accessorKey: "flags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Eigenschaften" />
      ),
      cell: ({ row }) => {
        const material = row.original;
        const flags = [];

        if (material.isMetal) flags.push("Metall");
        if (material.isStone) flags.push("Stein");
        if (material.isGem) flags.push("Edelstein");
        if (material.isOrganic) flags.push("Organisch");
        if (material.isFabric) flags.push("Stoff");

        return (
          <div className="flex flex-wrap gap-1">
            {flags.map((flag) => (
              <Badge key={flag} variant="outline" className="text-xs">
                {flag}
              </Badge>
            ))}
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
                  aria-label="Weitere Optionen"
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
                  <Eye className="mr-2 h-4 w-4" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRowAction({ row, type: "update" })}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setRowAction({ row, type: "delete" })}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Löschen
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
