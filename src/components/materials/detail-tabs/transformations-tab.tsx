// src/components/materials/tabs/transformations-tab.tsx
import React, { useState, useEffect } from "react";
import { IMaterial } from "@/types/material";
import {
  MaterialTransformation,
  TransformationResult,
} from "@/types/material-transformation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Focus, Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MaterialTransformationPanel } from "../material-transformation-panel";
import {
  getSourceTransformationsForMaterial,
  getTargetTransformationsForMaterial,
} from "@/actions/material-transformations";

interface TransformationsTabProps {
  material: IMaterial;
  onTransform?: (result: TransformationResult) => void;
  onCreateTransformation?: () => void;
  isReadOnly?: boolean;
}

export function TransformationsTab({
  material,
  onTransform,
  onCreateTransformation,
  isReadOnly = false,
}: TransformationsTabProps) {
  const [sourceTransformations, setSourceTransformations] = useState<
    MaterialTransformation[]
  >([]);
  const [targetTransformations, setTargetTransformations] = useState<
    MaterialTransformation[]
  >([]);
  const [isLoadingTransformations, setIsLoadingTransformations] =
    useState(false);

  // Load transformations when material changes
  useEffect(() => {
    const loadTransformations = async () => {
      if (!material) return;

      setIsLoadingTransformations(true);
      try {
        const sourceResult = await getSourceTransformationsForMaterial(
          material.id
        );
        setSourceTransformations(sourceResult);

        const targetResult = await getTargetTransformationsForMaterial(
          material.id
        );
        setTargetTransformations(targetResult);
      } catch (error) {
        console.error("Error loading transformations:", error);
      } finally {
        setIsLoadingTransformations(false);
      }
    };

    loadTransformations();
  }, [material]);

  return (
    <div className="space-y-6">
      <Separator />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Material Transformations</h3>

        {!isReadOnly && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateTransformation}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transformation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Transformation</DialogTitle>
                <DialogDescription>
                  Define a process to transform this material into another
                </DialogDescription>
              </DialogHeader>

              {/* This will be where your transformation form goes */}
              {/* We'll implement this in a separate component */}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoadingTransformations ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : sourceTransformations.length === 0 &&
        targetTransformations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No transformations available for this material.</p>
          <p className="text-sm mt-2">
            Transformations define how materials can be converted from one form
            to another.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sourceTransformations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Focus className="h-5 w-5" />
                Source Transformations
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Processes that use this material as an input
              </p>

              <MaterialTransformationPanel
                transformations={sourceTransformations}
                direction="source"
                onTransform={onTransform}
              />
            </div>
          )}

          {targetTransformations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mt-6">
                <Flame className="h-5 w-5" />
                Target Transformations
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Processes that create this material as an output
              </p>

              <MaterialTransformationPanel
                transformations={targetTransformations}
                direction="target"
                onTransform={onTransform}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
