"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Shield,
  Sword,
  Weight,
  DollarSign,
  Heart,
  Ruler,
  Target,
  BarChart2,
  Edit,
  Trash,
} from "lucide-react";
import { IWeapon, WeaponType, WeaponCategory } from "@/types/weapon";
import { deleteWeapon } from "@/actions/weapons";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamically import the RangeChart component
const RangeChart = dynamic(
  () => import("@/components/weapons/weapon-detail/range-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center bg-muted rounded-md">
        Lade Reichweitenchart...
      </div>
    ),
  }
);

interface WeaponDetailProps {
  weapon: IWeapon;
}

export const WeaponDetail: React.FC<WeaponDetailProps> = ({ weapon }) => {
  const router = useRouter();

  // Formatierung der Reichweite für die Anzeige
  const getFormattedRange = (): string => {
    if (!weapon.range || weapon.range.size === 0) return "Keine Angabe";

    if (weapon.range.size === 1) {
      const value = Array.from(weapon.range.values())[0];
      return `${value}m`;
    }

    const rangeEntries = Array.from(weapon.range.entries());
    const value = rangeEntries[rangeEntries.length - 1][1];
    return String(value);
  };

  // Formatierung des Schadens für die Anzeige
  const getFormattedDamage = (): string => {
    if (!weapon.baseDamage || weapon.baseDamage.length === 0)
      return "Keine Angabe";

    if (weapon.baseDamage.length === 1) {
      return `${weapon.baseDamage[0]}`;
    }

    return `${weapon.baseDamage[0]}-${weapon.baseDamage[1]}`;
  };

  // Formatierung des Gewichts für die Anzeige
  const getFormattedWeight = (): string => {
    if (!weapon.weight || weapon.weight.length === 0) return "Keine Angabe";

    if (weapon.weight.length === 1) {
      return `${weapon.weight[0]} kg`;
    }

    return `${weapon.weight[0]}-${weapon.weight[1]} kg`;
  };

  // Formatierung des Typs für die Anzeige
  const getWeaponTypeDisplay = (): string => {
    switch (weapon.type) {
      case WeaponType.MELEE:
        return "Nahkampfwaffe";
      case WeaponType.RANGED:
        return "Fernkampfwaffe";
      case WeaponType.THROWING:
        return "Wurfwaffe";
      default:
        return weapon.type;
    }
  };

  // Badge-Farbe basierend auf dem Waffentyp
  const getTypeBadgeColor = (): string => {
    switch (weapon.type) {
      case WeaponType.MELEE:
        return "bg-red-600";
      case WeaponType.RANGED:
        return "bg-sky-600";
      case WeaponType.THROWING:
        return "bg-emerald-600";
      default:
        return "";
    }
  };

  const handleDeleteWeapon = async () => {
    const confirmed = window.confirm(
      "Möchtest du diese Waffe wirklich löschen?"
    );
    if (!confirmed) return;

    try {
      const result = await deleteWeapon(weapon.id);
      if (result.success) {
        toast.success("Waffe erfolgreich gelöscht");
        router.push("/weapons");
      }
    } catch (error) {
      console.error("Error deleting weapon:", error);
      toast.error("Fehler beim Löschen der Waffe");
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.push("/weapons")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Übersicht
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/weapons/${weapon.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Bearbeiten
            </Button>
            <Button variant="destructive" onClick={handleDeleteWeapon}>
              <Trash className="mr-2 h-4 w-4" /> Löschen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hauptinfo-Karte */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <CardTitle className="text-2xl">{weapon.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Badge className={getTypeBadgeColor()}>
                    {getWeaponTypeDisplay()}
                  </Badge>
                  <span className="ml-2">{weapon.category}</span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-3 py-1">
                {weapon.material}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">{weapon.description}</p>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Schaden:</span>
                  <span className="ml-2">{getFormattedDamage()}</span>
                </div>

                <div className="flex items-center">
                  <Weight className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Gewicht:</span>
                  <span className="ml-2">{getFormattedWeight()}</span>
                </div>

                <div className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Preis:</span>
                  <span className="ml-2">{weapon.price} Gold</span>
                </div>

                <div className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Material:</span>
                  <span className="ml-2">{weapon.material}</span>
                </div>

                <div className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Haltbarkeit:</span>
                  <span className="ml-2">{weapon.durability}/100</span>
                </div>

                {weapon.range && weapon.range.size > 0 && (
                  <div className="flex items-center">
                    <Target className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">max. Reichweite:</span>
                    <span className="ml-2">{getFormattedRange()}</span>
                  </div>
                )}
              </div>

              {/* Reichweiten-Chart (nur wenn Werte vorhanden sind) */}
              {weapon.range && weapon.range.size > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Reichweitenprofil:</h3>
                  <div className="border rounded-md p-4 bg-card">
                    <RangeChart range={weapon.range} />
                  </div>
                </div>
              )}

              <Separator />

              {/* Waffen-Eigenschaften */}
              {weapon.properties && weapon.properties.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Eigenschaften:</h3>
                  <div className="flex flex-wrap gap-2">
                    {weapon.properties.map((property, index) => (
                      <Badge key={index} variant="outline">
                        {property}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Griffarten anzeigen */}
              {weapon.grasp && weapon.grasp.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Griffart:</h3>
                  <div className="flex flex-wrap gap-2">
                    {weapon.grasp.map((grasp, index) => (
                      <Badge key={index} variant="outline">
                        {grasp === "ONE_HANDED" ? "Einhändig" : "Zweihändig"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Waffenspezifische Informationen basierend auf dem Typ */}
              {weapon.type === WeaponType.MELEE && (
                <div>
                  <h3 className="font-medium mb-2">Nahkampf-Details:</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Nahkampfwaffe kann in direktem Kontakt mit Gegnern
                    eingesetzt werden. Sie ist besonders effektiv gegen{" "}
                    {weapon.category === WeaponCategory.AXES ||
                    weapon.category === WeaponCategory.SWORDS
                      ? "ungepanzerte Gegner"
                      : weapon.category === WeaponCategory.HAMMERS ||
                        weapon.category === WeaponCategory.MACES
                      ? "gepanzerte Gegner"
                      : "verschiedene Gegnertypen"}
                    .
                  </p>
                </div>
              )}

              {weapon.type === WeaponType.RANGED && (
                <div>
                  <h3 className="font-medium mb-2">Fernkampf-Details:</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Fernkampfwaffe erlaubt Angriffe aus sicherer Distanz.
                    {weapon.category === WeaponCategory.BOWS
                      ? " Bögen erfordern Pfeile als Munition und eine ruhige Hand für präzise Schüsse."
                      : weapon.category === WeaponCategory.CROSSBOWS
                      ? " Armbrüste bieten hohe Präzision und Durchschlagskraft, benötigen aber Zeit zum Nachladen."
                      : weapon.category === WeaponCategory.FIREARMS
                      ? " Feuerwaffen verursachen großen Schaden mit einer explosiven Ladung, sind aber langsam nachzuladen."
                      : " Diese Fernkampfwaffe hat einzigartige Eigenschaften."}
                  </p>
                </div>
              )}

              {weapon.type === WeaponType.THROWING && (
                <div>
                  <h3 className="font-medium mb-2">Wurfwaffen-Details:</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Wurfwaffe kann auf Distanz eingesetzt werden und
                    verursacht
                    {weapon.category === WeaponCategory.THROWING_WEAPONS
                      ? " mittleren bis hohen Schaden. Nach dem Wurf muss die Waffe eingesammelt oder ersetzt werden."
                      : weapon.category === WeaponCategory.THROWABLE_ITEMS
                      ? " spezielle Effekte oder Flächenschaden. Diese Gegenstände sind in der Regel Verbrauchsmaterial."
                      : " verschiedene Arten von Schaden je nach Ziel und Wurfstil."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bild und weitere Infos */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {weapon.imageUrl ? (
              <img
                src={weapon.imageUrl}
                alt={weapon.name}
                className="max-w-full max-h-64 object-contain mb-4"
              />
            ) : (
              <div className="w-full h-64 bg-muted flex items-center justify-center mb-4">
                {weapon.type === WeaponType.MELEE ? (
                  <Sword className="h-16 w-16 text-muted-foreground" />
                ) : weapon.type === WeaponType.RANGED ? (
                  <Target className="h-16 w-16 text-muted-foreground" />
                ) : (
                  <Weight className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            )}

            <div className="w-full mt-4 space-y-2">
              <h3 className="font-medium mb-2 text-center">Zustand</h3>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    weapon.durability > 75
                      ? "bg-green-500"
                      : weapon.durability > 50
                      ? "bg-yellow-500"
                      : weapon.durability > 25
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${weapon.durability}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {weapon.durability}/100
                {weapon.durability > 90
                  ? " (Ausgezeichnet)"
                  : weapon.durability > 75
                  ? " (Gut)"
                  : weapon.durability > 50
                  ? " (Gebraucht)"
                  : weapon.durability > 25
                  ? " (Abgenutzt)"
                  : " (Stark beschädigt)"}
              </p>
            </div>

            {/* Einsatzgebiete */}
            <div className="w-full mt-8">
              <h3 className="font-medium mb-2">Einsatzgebiete</h3>
              <div className="space-y-2">
                <Badge
                  className="w-full justify-center py-1"
                  variant={
                    weapon.type === WeaponType.MELEE ? "default" : "outline"
                  }
                >
                  Nahkampf
                </Badge>
                <Badge
                  className="w-full justify-center py-1"
                  variant={
                    weapon.type === WeaponType.RANGED ? "default" : "outline"
                  }
                >
                  Fernkampf
                </Badge>
                <Badge
                  className="w-full justify-center py-1"
                  variant={
                    weapon.type === WeaponType.THROWING ? "default" : "outline"
                  }
                >
                  Distanzangriff
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
