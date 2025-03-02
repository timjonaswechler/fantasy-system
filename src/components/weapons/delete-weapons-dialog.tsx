"use client";

import { IWeapon } from "@/types/weapon";
import { deleteWeapon } from "@/actions/weapons";
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

interface DeleteWeaponDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  weapon?: IWeapon | null;
  weapons?: IWeapon[];
  showTrigger?: boolean;
  onSuccess?: () => void;
  id?: string;
}

export function DeleteWeaponDialog({
  weapon,
  weapons = [],
  showTrigger = true,
  onSuccess,
  id,
  ...props
}: DeleteWeaponDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // If a single weapon is provided, add it to the weapons array
  const weaponsToDelete = weapon ? [weapon] : weapons;

  async function deleteWeapons() {
    const errors: string[] = [];

    for (const weapon of weaponsToDelete) {
      try {
        await deleteWeapon(weapon.id);
      } catch (error) {
        console.error(`Error deleting weapon ${weapon.id}:`, error);
        errors.push(weapon.name);
      }
    }

    if (errors.length > 0) {
      toast.error(
        `Fehler beim Löschen von ${errors.length} Waffen: ${errors
          .slice(0, 3)
          .join(", ")}${
          errors.length > 3 ? ` und ${errors.length - 3} weiteren` : ""
        }`
      );
    } else {
      toast.success(
        `${
          weaponsToDelete.length === 1
            ? "Waffe erfolgreich gelöscht"
            : `${weaponsToDelete.length} Waffen erfolgreich gelöscht`
        }`
      );
    }
  }

  function onDelete() {
    startDeleteTransition(async () => {
      await deleteWeapons();
      props.onOpenChange?.(false);
      onSuccess?.();
    });
  }

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle>Waffen löschen</DialogTitle>
        <DialogDescription>
          {weaponsToDelete.length === 1
            ? `Möchtest du "${weaponsToDelete[0].name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
            : `Möchtest du ${weaponsToDelete.length} Waffen wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:space-x-0">
        <DialogClose asChild>
          <Button variant="outline">Abbrechen</Button>
        </DialogClose>
        <Button
          aria-label="Ausgewählte Waffen löschen"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeletePending}
        >
          {isDeletePending && (
            <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
          )}
          Löschen
        </Button>
      </DialogFooter>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button id={id} variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              Löschen ({weaponsToDelete.length})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>{dialogContent}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      {showTrigger ? (
        <DrawerTrigger asChild>
          <Button id={id} variant="outline" size="sm">
            <Trash className="mr-2 size-4" aria-hidden="true" />
            Löschen ({weaponsToDelete.length})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Waffen löschen</DrawerTitle>
          <DrawerDescription>
            {weaponsToDelete.length === 1
              ? `Möchtest du "${weaponsToDelete[0].name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
              : `Möchtest du ${weaponsToDelete.length} Waffen wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DrawerClose>
          <Button
            aria-label="Ausgewählte Waffen löschen"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            Löschen
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
