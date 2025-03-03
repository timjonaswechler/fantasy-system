"use client";

import { IWeapon, deleteWeapon } from "@/actions/weapons";
import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DeleteWeaponsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  weapons: IWeapon[];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteWeaponsDialog({
  weapons,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteWeaponsDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  function onDelete() {
    startDeleteTransition(async () => {
      try {
        // Delete weapons one by one
        for (const weapon of weapons) {
          await deleteWeapon(weapon.id);
        }

        props.onOpenChange?.(false);
        toast.success(`${weapons.length === 1 ? "Weapon" : "Weapons"} deleted`);
        onSuccess?.();
      } catch (error) {
        console.error("Error deleting weapons:", error);
        toast.error("Failed to delete weapons");
      }
    });
  }

  if (isDesktop) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              Delete ({weapons.length})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-medium"> {weapons.length} </span>
              {weapons.length === 1 ? " weapon" : " weapons"} from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              aria-label="Delete selected weapons"
              variant="destructive"
              onClick={onDelete}
              disabled={isDeletePending}
            >
              {isDeletePending && (
                <Loader
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      {showTrigger ? (
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash className="mr-2 size-4" aria-hidden="true" />
            Delete ({weapons.length})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>
            This action cannot be undone. This will permanently delete
            <span className="font-medium"> {weapons.length} </span>
            {weapons.length === 1 ? " weapon" : " weapons"} from the database.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button
            aria-label="Delete selected weapons"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
