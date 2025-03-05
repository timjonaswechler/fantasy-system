// src/components/materials/delete-materials-dialog.tsx
"use client";

import { deleteMaterial } from "@/actions/materials";
import { IMaterial } from "@/types/material";
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

interface DeleteMaterialsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  materials: IMaterial[];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteMaterialsDialog({
  materials,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteMaterialsDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  function onDelete() {
    startDeleteTransition(async () => {
      try {
        // Materialien einzeln löschen
        for (const material of materials) {
          await deleteMaterial(material.id);
        }

        props.onOpenChange?.(false);
        toast.success(
          `${materials.length === 1 ? "Material" : "Materialien"} gelöscht`
        );
        onSuccess?.();
      } catch (error) {
        console.error("Fehler beim Löschen der Materialien:", error);
        toast.error("Materialien konnten nicht gelöscht werden");
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
              Löschen ({materials.length})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sind Sie sicher?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
              <span className="font-medium"> {materials.length} </span>
              {materials.length === 1 ? " Material" : " Materialien"} werden
              dauerhaft aus der Datenbank gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button
              aria-label="Ausgewählte Materialien löschen"
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
              Löschen
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
            Löschen ({materials.length})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Sind Sie sicher?</DrawerTitle>
          <DrawerDescription>
            Diese Aktion kann nicht rückgängig gemacht werden.
            <span className="font-medium"> {materials.length} </span>
            {materials.length === 1 ? " Material" : " Materialien"} werden
            dauerhaft aus der Datenbank gelöscht.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DrawerClose>
          <Button
            aria-label="Ausgewählte Materialien löschen"
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
