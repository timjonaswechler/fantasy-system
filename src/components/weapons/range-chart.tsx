"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Definieren von Typen für die Props und Zwischendaten
export interface RangeChartProps {
  range: Map<number, number> | undefined;
}

interface ChartDataPoint {
  precision: number; // Präzision in Prozent (0-100)
  distance: number; // Entfernung in Metern
}

const RangeChart: React.FC<RangeChartProps> = ({ range }) => {
  // Wenn keine Reichweite vorhanden ist
  if (!range || range.size === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-muted rounded-md">
        <p className="text-muted-foreground">Keine Präzisionsdaten verfügbar</p>
      </div>
    );
  }

  // Konvertiere Map-Einträge in ein Format für den Chart
  const chartData: ChartDataPoint[] = Array.from(range.entries()).map(
    ([key, value]) => ({
      precision: key, // Präzision in Prozent
      distance: value, // Entfernung in Metern
    })
  );

  // Sortiere die Datenpunkte nach Entfernung für eine korrekte Liniendarstellung
  const sortedData = [...chartData].sort((a, b) => a.distance - b.distance);

  // Finde maximale Entfernung für die Skalierung
  const maxDistance = Math.max(...sortedData.map((d) => d.distance));

  // Generiere Skala mit sinnvollen Tickmarks für die X-Achse
  const getDistanceTickValues = (max: number): number[] => {
    // Basis-Schrittweite bestimmen
    let step: number;
    if (max <= 10) step = 1;
    else if (max <= 50) step = 10;
    else if (max <= 100) step = 20;
    else if (max <= 500) step = 100;
    else step = 200;

    const ticks: number[] = [];
    for (let i = 0; i <= max; i += step) {
      ticks.push(i);
    }

    // Sicherstellen, dass der maximale Wert enthalten ist
    if (!ticks.includes(max)) {
      ticks.push(max);
    }

    return ticks;
  };

  // Tickmarks für die Y-Achse (Genauigkeit in %)
  const precisionTicks = [0, 20, 40, 60, 80, 100];

  const distanceTicks = getDistanceTickValues(maxDistance);

  return (
    <div className="w-full">
      <h3 className="font-medium mb-2 text-center">Präzisionsprofil</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={sortedData}
          margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="distance"
            type="number" // Explizite numerische Achse für korrekte Skalierung
            scale="linear" // Lineare Skalierung für proportionale Abstände
            domain={[0, Math.ceil(maxDistance * 1.1)]} // Skaliert von 0 bis etwas über dem Maximum
            label={{ value: "Entfernung (m)", position: "bottom", offset: 20 }}
            ticks={distanceTicks}
            allowDataOverflow={false}
          />
          <YAxis
            dataKey="precision"
            label={{
              value: "Präzision (%)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
            }}
            domain={[0, 100]}
            ticks={precisionTicks}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              return name === "precision"
                ? [`${value}%`, "Präzision"]
                : [`${value}m`, "Entfernung"];
            }}
            labelFormatter={(value) => `Bei ${value}m Entfernung`}
          />
          <Area
            type="monotone"
            dataKey="precision"
            stroke="#3498db"
            fill="#3498db"
            fillOpacity={0.6}
            animationDuration={500}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RangeChart;
