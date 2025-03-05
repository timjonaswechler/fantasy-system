// src/components/materials/material-detail-sheet.tsx
"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Scale,
  ThermometerSnowflake,
  Flame,
  Sparkles,
  Edit,
  Trash,
  Diamond,
  Tag,
  Ruler,
  SquareStack,
} from "lucide-react";
import { IMaterial, MaterialCategory } from "@/types/material";
import {
  calculateMaterialQuality,
  calculateDensity,
  getDerivedProperties,
} from "@/lib/material-utils";

interface MaterialDetailSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  material: IMaterial | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MaterialDetailSheet({
  material,
  onEdit,
  onDelete,
  ...props
}: MaterialDetailSheetProps) {
  if (!material) return null;

  // Materialeigenschaften berechnen
  const quality = calculateMaterialQuality(material);
  const densityInGcm3 = calculateDensity(material, "g/cm3");
  const derivedProps = getDerivedProperties(material);

  // Qualitätsanzeige-Klasse
  const getQualityColorClass = (q: number) => {
    if (q >= 80) return "bg-green-500";
    if (q >= 60) return "bg-lime-500";
    if (q >= 40) return "bg-yellow-500";
    if (q >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  // Kategorie-Badge-Variante
  const getCategoryBadgeVariant = ():
    | "default"
    | "destructive"
    | "outline"
    | "secondary" => {
    switch (material.category) {
      case MaterialCategory.METAL:
        return "default";
      case MaterialCategory.GEM:
        return "destructive";
      case MaterialCategory.STONE:
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl">{material.name}</SheetTitle>
              <div className="flex items-center mt-1">
                <Badge variant={getCategoryBadgeVariant()}>
                  {material.category}
                </Badge>
                <div className="ml-3 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${getQualityColorClass(
                      quality
                    )}`}
                  ></div>
                  <span className="text-sm">
                    Qualität: {quality.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <SheetDescription className="mt-2">
            {material.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Scale className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Dichte:</span>
              <span className="ml-2">
                {material.density} kg/m³ ({densityInGcm3.toFixed(2)} g/cm³)
              </span>
            </div>

            <div className="flex items-center">
              <Tag className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Wertmodifikator:</span>
              <span className="ml-2">×{material.valueModifier.toFixed(1)}</span>
            </div>

            {material.meltingPoint && (
              <div className="flex items-center">
                <ThermometerSnowflake className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Schmelzpunkt:</span>
                <span className="ml-2">{material.meltingPoint}°C</span>
              </div>
            )}

            {material.boilingPoint && (
              <div className="flex items-center">
                <Flame className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Siedepunkt:</span>
                <span className="ml-2">{material.boilingPoint}°C</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">
              Mechanische Eigenschaften
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Druckfestigkeit</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Streckgrenze:
                    </span>
                    <p>{material.impactYield} N/mm²</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Bruchfestigkeit:
                    </span>
                    <p>{material.impactFracture} N/mm²</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Scherfestigkeit</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Streckgrenze:
                    </span>
                    <p>{material.shearYield} N/mm²</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Bruchfestigkeit:
                    </span>
                    <p>{material.shearFracture} N/mm²</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">
              Abgeleitete Eigenschaften
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center">
                <SquareStack className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Stärke/Gewicht:</span>
                <span className="ml-2">
                  {(derivedProps.strengthToWeightRatio as number).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center">
                <Ruler className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Steifigkeit:</span>
                <span className="ml-2">
                  {(derivedProps.stiffness as number).toFixed(0)}
                </span>
              </div>

              <div className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Duktilität:</span>
                <span className="ml-2">
                  {(derivedProps.ductility as number).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center">
                <Diamond className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Zähigkeit:</span>
                <span className="ml-2">
                  {(derivedProps.toughness as number).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Materialtyp-Indikatoren */}
          <div>
            <h3 className="text-lg font-medium mb-2">Materialeigenschaften</h3>
            <div className="flex flex-wrap gap-2">
              {material.isMetal && <Badge>Metall</Badge>}
              {material.isStone && <Badge>Stein</Badge>}
              {material.isGem && <Badge variant="destructive">Edelstein</Badge>}
              {material.isOrganic && (
                <Badge variant="secondary">Organisch</Badge>
              )}
              {material.isFabric && <Badge variant="outline">Stoff</Badge>}
            </div>
          </div>

          {/* Zusätzliche Eigenschaften, falls vorhanden */}
          {material.additionalProperties &&
            Object.keys(material.additionalProperties).length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Zusätzliche Eigenschaften
                </h3>
                <div className="border rounded-md p-4 bg-muted/30">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(material.additionalProperties).map(
                      ([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <dt className="text-sm text-muted-foreground">
                            {key}
                          </dt>
                          <dd className="font-medium">{String(value)}</dd>
                        </div>
                      )
                    )}
                  </dl>
                </div>
              </div>
            )}
        </div>

        <SheetFooter className="flex gap-2 pt-6 border-t mt-6">
          <Button onClick={onEdit} variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Bearbeiten
          </Button>
          <Button onClick={onDelete} variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Löschen
          </Button>
          <SheetClose asChild>
            <Button variant="secondary">Schließen</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
