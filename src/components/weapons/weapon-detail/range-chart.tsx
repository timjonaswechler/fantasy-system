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

// Define types for props and intermediate data
export interface RangeChartProps {
  range: Map<number, number> | undefined;
}

interface ChartDataPoint {
  precision: number; // Precision in percent (0-100)
  distance: number; // Distance in meters
}

const RangeChart: React.FC<RangeChartProps> = ({ range }) => {
  // If no range data is available
  if (!range || range.size === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-muted rounded-md">
        <p className="text-muted-foreground">No precision data available</p>
      </div>
    );
  }

  // Convert Map entries to a format for the chart
  const chartData: ChartDataPoint[] = Array.from(range.entries()).map(
    ([key, value]) => ({
      precision: key, // Precision in percent
      distance: value, // Distance in meters
    })
  );

  // Sort data points by distance for correct line rendering
  const sortedData = [...chartData].sort((a, b) => a.distance - b.distance);

  // Find maximum distance for scaling
  const maxDistance = Math.max(...sortedData.map((d) => d.distance));

  // Generate scale with meaningful tick marks for the X-axis
  const getDistanceTickValues = (max: number): number[] => {
    // Determine base step size
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

    // Ensure the maximum value is included
    if (!ticks.includes(max)) {
      ticks.push(max);
    }

    return ticks;
  };

  // Tick marks for the Y-axis (accuracy in %)
  const precisionTicks = [0, 20, 40, 60, 80, 100];

  const distanceTicks = getDistanceTickValues(maxDistance);

  return (
    <div className="w-full">
      <h3 className="font-medium mb-2 text-center">Precision Profile</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={sortedData}
          margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="distance"
            type="number" // Explicit numeric axis for correct scaling
            scale="linear" // Linear scaling for proportional distances
            domain={[0, Math.ceil(maxDistance * 1.1)]} // Scale from 0 to slightly above maximum
            label={{ value: "Distance (m)", position: "bottom", offset: 20 }}
            ticks={distanceTicks}
            allowDataOverflow={false}
          />
          <YAxis
            dataKey="precision"
            label={{
              value: "Precision (%)",
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
                ? [`${value}%`, "Precision"]
                : [`${value}m`, "Distance"];
            }}
            labelFormatter={(value) => `At ${value}m distance`}
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
