"use client";

import { IWeapon, WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import type { DataTableRowAction } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Ellipsis, Sword, Target, Palette, SquareStack } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<IWeapon> | null>
  >;
}

// Helper function to get weapon type icon
export function getWeaponTypeIcon(type: WeaponType) {
  switch (type) {
    case WeaponType.MELEE:
      return Sword;
    case WeaponType.RANGED:
    case WeaponType.THROWING:
      return Target;
    default:
      return Sword;
  }
}

// Helper function to get colored badge variant for weapon type
export function getWeaponTypeBadgeVariant(type: WeaponType) {
  switch (type) {
    case WeaponType.MELEE:
      return "destructive";
    case WeaponType.RANGED:
      return "blue";
    case WeaponType.THROWING:
      return "green";
    default:
      return "default";
  }
}

// Helper function to translate weapon type to German
export function translateWeaponType(type: WeaponType) {
  switch (type) {
    case WeaponType.MELEE:
      return "Nahkampf";
    case WeaponType.RANGED:
      return "Fernkampf";
    case WeaponType.THROWING:
      return "Wurfwaffe";
    default:
      return type;
  }
}

// Helper function to translate grasp type to German
export function translateGraspType(grasp: GraspType) {
  switch (grasp) {
    case GraspType.ONE_HANDED:
      return "Einhändig";
    case GraspType.TWO_HANDED:
      return "Zweihändig";
    default:
      return grasp;
  }
}

export function getWeaponsColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<IWeapon>[] {
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
          aria-label="Alle auswählen"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Waffe auswählen"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[500px]">
          <span className="font-medium truncate">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Typ" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as WeaponType;
        const Icon = getWeaponTypeIcon(type);

        return (
          <div className="flex items-center gap-2">
            <Badge variant={getWeaponTypeBadgeVariant(type)}>
              <Icon className="mr-1 size-3.5" />
              {translateWeaponType(type)}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kategorie" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Badge variant="outline">{row.getValue("category")}</Badge>
        </div>
      ),
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
    {
      id: "grasp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Griffart" />
      ),
      cell: ({ row }) => {
        const weapon = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {weapon.grasp.map((grasp, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {translateGraspType(grasp)}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (!Array.isArray(value) || value.length === 0) return true;
        const weapon = row.original;
        return weapon.grasp.some((grasp) => value.includes(grasp));
      },
    },
    {
      accessorKey: "material",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Material" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Palette
            className="mr-2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{row.getValue("material")}</span>
        </div>
      ),
    },
    {
      id: "damage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Schaden" />
      ),
      cell: ({ row }) => {
        const weapon = row.original;
        return (
          <div className="flex items-center">
            <span>
              {weapon.baseDamage[0]}-{weapon.baseDamage[1]}
            </span>
          </div>
        );
      },
    },
    {
      id: "durability",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Haltbarkeit" />
      ),
      cell: ({ row }) => {
        const durability = row.original.durability;
        let color = "bg-green-500";

        if (durability < 25) color = "bg-red-500";
        else if (durability < 50) color = "bg-orange-500";
        else if (durability < 75) color = "bg-yellow-500";

        return (
          <div className="flex items-center gap-2">
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full ${color}`}
                style={{ width: `${durability}%` }}
              />
            </div>
            <span className="text-xs w-8">{durability}%</span>
          </div>
        );
      },
    },
    {
      id: "properties",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Eigenschaften" />
      ),
      cell: ({ row }) => {
        const weapon = row.original;
        const properties = weapon.properties || [];

        if (properties.length === 0) {
          return <span className="text-muted-foreground text-xs">Keine</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {properties.slice(0, 2).map((property, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {property}
              </Badge>
            ))}
            {properties.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{properties.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const weapon = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Aktionen öffnen"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <a href={`/weapons/${weapon.id}`}>Anzeigen</a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "update" })}
              >
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "delete" })}
                className="text-destructive"
              >
                Löschen
                <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
