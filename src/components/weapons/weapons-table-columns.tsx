"use client";

import { IWeapon } from "@/actions/weapons";
import type { DataTableRowAction } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Ellipsis, Sword, Target, Hand } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WeaponType, GraspType } from "@/types/weapon";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<IWeapon> | null>
  >;
}

// Function to get weapon type icon
const getWeaponTypeIcon = (type: WeaponType) => {
  switch (type) {
    case WeaponType.MELEE:
      return Sword;
    case WeaponType.RANGED:
      return Target;
    case WeaponType.THROWING:
      return Hand;
    default:
      return Sword;
  }
};

export function getColumns({
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
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        const Icon = getWeaponTypeIcon(type);

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon
              className="mr-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="capitalize">{type}</span>
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
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = row.original.category;

        return (
          <div className="flex items-center">
            <Badge variant="outline" className="capitalize">
              {category}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "baseDamage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Damage" />
      ),
      cell: ({ row }) => {
        const damage = row.original.baseDamage;
        return (
          <div className="flex items-center">
            <span>
              {damage[0]} - {damage[1]}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const price = row.original.price;
        return (
          <div className="flex items-center">
            <span>{price} GP</span>
          </div>
        );
      },
    },
    {
      accessorKey: "grasp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Grasp" />
      ),
      cell: ({ row }) => {
        const grasp = row.original.grasp;

        return (
          <div className="flex items-center gap-1">
            {grasp.map((g) => (
              <Badge key={g} variant="secondary" className="capitalize">
                {g === GraspType.ONE_HANDED ? "1H" : "2H"}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        // Custom filter function for the grasp array
        if (!Array.isArray(value) || value.length === 0) return true;
        const graspTypes = row.original.grasp;
        return value.some((v) => graspTypes.includes(v as GraspType));
      },
    },
    {
      accessorKey: "material",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Material" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <span>{row.original.material}</span>
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
        return (
          <div className="flex items-center">
            <span>{row.original.durability}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "update" })}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  window.location.href = `/weapons/${row.original.id}`;
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "delete" })}
              >
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
