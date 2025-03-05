// src/lib/material-utils.ts

import { IMaterial } from "@/types/material";

/**
 * Berechnet die Dichte eines Materials in verschiedenen Einheiten
 */
export function calculateDensity(
  material: IMaterial,
  unit: "kg/m3" | "g/cm3" | "lb/ft3" = "kg/m3"
): number {
  const density = material.density; // kg/m³

  switch (unit) {
    case "g/cm3":
      return density / 1000; // kg/m³ zu g/cm³
    case "lb/ft3":
      return density * 0.062428; // kg/m³ zu lb/ft³
    default:
      return density; // kg/m³
  }
}

/**
 * Berechnet die Energiemenge, die zum Schmelzen einer bestimmten Masse des Materials benötigt wird
 * @param material Das Material
 * @param mass Die Masse in kg
 * @returns Die benötigte Energie in Joule
 */
export function calculateMeltingEnergy(
  material: IMaterial,
  mass: number
): number | null {
  if (!material.specificHeat || !material.meltingPoint) {
    return null;
  }

  // Annahme: Ausgangszustand ist bei 20°C (Raumtemperatur)
  const roomTemperature = 20;
  const temperatureDifference = material.meltingPoint - roomTemperature;

  // E = m * c * ΔT
  // Wo: E = Energie, m = Masse, c = spezifische Wärmekapazität, ΔT = Temperaturunterschied
  return mass * material.specificHeat * temperatureDifference;
}

/**
 * Berechnet den Materialwert basierend auf Masse, Verarbeitungsqualität und Marktbedingungen
 */
export function calculateMaterialValue(
  material: IMaterial,
  mass: number,
  quality: number = 1.0,
  marketFactor: number = 1.0
): number {
  // Basispreis = Masse * Wertmodifikator * Qualität * Marktfaktor
  return mass * material.valueModifier * quality * marketFactor;
}

/**
 * Berechnet die Tragfähigkeit eines Materialstücks
 * @param material Das Material
 * @param crossSectionalArea Die Querschnittsfläche in m²
 * @param length Die Länge in m
 * @returns Die maximale Last in Newton
 */
export function calculateLoadCapacity(
  material: IMaterial,
  crossSectionalArea: number,
  length: number
): number {
  // Einfache Abschätzung der Traglast basierend auf Festigkeitseigenschaften
  // In der Realität wäre dies komplexer und würde von der Geometrie abhängen
  const safetyFactor = 0.5; // Sicherheitsfaktor
  return material.impactYield * crossSectionalArea * safetyFactor;
}

/**
 * Berechnet die Bruchfestigkeit für verschiedene Belastungsarten
 * @param material Das Material
 * @param stressType Die Art der Belastung
 * @returns Die Festigkeit in N/mm²
 */
export function calculateStrength(
  material: IMaterial,
  stressType: "impact" | "shear"
): number {
  switch (stressType) {
    case "impact":
      return material.impactFracture;
    case "shear":
      return material.shearFracture;
    default:
      return 0;
  }
}

/**
 * Vergleicht zwei Materialien hinsichtlich einer bestimmten Eigenschaft
 * @returns -1 wenn materialA schlechter ist, 0 wenn gleich, 1 wenn materialA besser ist
 */
export function compareMaterialProperty(
  materialA: IMaterial,
  materialB: IMaterial,
  property: keyof IMaterial,
  higherIsBetter: boolean = true
): number {
  // Typensichere Prüfung, ob die Eigenschaft numerisch ist
  const valueA = materialA[property];
  const valueB = materialB[property];

  if (typeof valueA === "number" && typeof valueB === "number") {
    if (valueA < valueB) return higherIsBetter ? -1 : 1;
    if (valueA > valueB) return higherIsBetter ? 1 : -1;
    return 0;
  }

  // Für nicht-numerische Eigenschaften oder wenn die Werte nicht vergleichbar sind
  return 0;
}

/**
 * Berechnet einen Gesamtwert für die Materialqualität basierend auf verschiedenen Eigenschaften
 * @returns Ein Qualitätswert von 0-100
 */
export function calculateMaterialQuality(material: IMaterial): number {
  // Gewichtungsfaktoren für verschiedene Eigenschaften
  const weights = {
    impactYield: 0.15,
    impactFracture: 0.15,
    shearYield: 0.15,
    shearFracture: 0.15,
    density: 0.1,
    valueModifier: 0.3,
  };

  // Referenzwerte für die Normalisierung (können je nach Anwendungsfall angepasst werden)
  const references = {
    impactYield: 200,
    impactFracture: 400,
    shearYield: 120,
    shearFracture: 240,
    density: 7800, // Orientiert an Stahl
    valueModifier: 1.0,
  };

  // Qualitätsberechnung
  let quality = 0;

  // Für jede Eigenschaft einen normalisierten Beitrag zur Qualität berechnen
  quality +=
    (material.impactYield / references.impactYield) * weights.impactYield * 100;
  quality +=
    (material.impactFracture / references.impactFracture) *
    weights.impactFracture *
    100;
  quality +=
    (material.shearYield / references.shearYield) * weights.shearYield * 100;
  quality +=
    (material.shearFracture / references.shearFracture) *
    weights.shearFracture *
    100;

  // Für Dichte: Nicht linear, sondern mit optimaler Dichte
  const densityQuality = Math.max(
    0,
    100 - Math.abs(material.density - references.density) / 50
  );
  quality += densityQuality * weights.density;

  // Wertmodifikator direkt einbeziehen
  quality +=
    (material.valueModifier / references.valueModifier) *
    weights.valueModifier *
    100;

  // Auf 0-100 begrenzen
  return Math.max(0, Math.min(100, quality));
}

/**
 * Prüft, ob ein Material für eine bestimmte Anwendung geeignet ist
 */
export function isMaterialSuitableForUse(
  material: IMaterial,
  use: "weapon" | "armor" | "tool" | "jewelry"
): boolean {
  switch (use) {
    case "weapon":
      // Für Waffen sind hohe Festigkeitswerte wichtig
      return material.impactFracture > 100 && material.shearFracture > 60;

    case "armor":
      // Für Rüstungen ist eine gute Kombination aus Festigkeit und nicht zu hoher Dichte wichtig
      return material.impactFracture > 150 && material.density < 10000;

    case "tool":
      // Werkzeuge benötigen gute Festigkeit und Zähigkeit
      return material.impactYield > 80 && material.shearYield > 40;

    case "jewelry":
      // Schmuck basiert hauptsächlich auf Wert und Aussehen, nicht auf strukturellen Eigenschaften
      return material.valueModifier > 3.0 || material.isGem;

    default:
      return false;
  }
}

/**
 * Berechnet abgeleitete Eigenschaften des Materials, die nicht direkt gespeichert sind
 */
export function getDerivedProperties(
  material: IMaterial
): Record<string, number | string> {
  const derived: Record<string, number | string> = {
    // Verhältnis von Festigkeit zu Gewicht (höher ist besser für leichte, starke Materialien)
    strengthToWeightRatio: (material.impactFracture / material.density) * 1000,

    // Duktilität - die Fähigkeit, sich unter Belastung zu verformen, statt zu brechen
    ductility: material.impactStrainAtYield * 1000,

    // Zähigkeit - Fähigkeit, Energie zu absorbieren
    toughness:
      ((material.impactFracture + material.impactYield) / 2) *
      material.impactStrainAtYield,

    // Steifigkeit - Widerstand gegen Verformung
    stiffness: material.impactYield / material.impactStrainAtYield,
  };

  // Materialzustand bei Raumtemperatur (20°C)
  if (material.meltingPoint) {
    if (material.meltingPoint < 20) {
      derived.stateAtRoomTemp = "Flüssig";
    } else if (material.boilingPoint && material.boilingPoint < 20) {
      derived.stateAtRoomTemp = "Gasförmig";
    } else {
      derived.stateAtRoomTemp = "Fest";
    }
  } else {
    derived.stateAtRoomTemp = "Unbekannt";
  }

  return derived;
}
