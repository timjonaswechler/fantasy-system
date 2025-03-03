// src/app/weapons/page.tsx
import * as React from "react";
import { getWeapons } from "@/actions/weapons";
import { WeaponsTable } from "@/components/weapons/weapons-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";
import { FeatureFlagsProvider } from "@/components/weapons/feature-flags-provider";

export const dynamic = "force-dynamic";

export default async function WeaponsPage() {
  return (
    <Shell className="gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weapons</h1>
          <p className="text-muted-foreground">Manage your weapons inventory</p>
        </div>
      </div>

      {/* <FeatureFlagsProvider> */}
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            searchableColumnCount={1}
            filterableColumnCount={3}
            cellWidths={[
              "10rem",
              "8rem",
              "8rem",
              "8rem",
              "8rem",
              "6rem",
              "8rem",
              "8rem",
            ]}
            shrinkZero
          />
        }
      >
        <WeaponsTableWrapper />
      </React.Suspense>
      {/* </FeatureFlagsProvider> */}
    </Shell>
  );
}

// Separate component to fetch data within suspense boundary
async function WeaponsTableWrapper() {
  const weapons = await getWeapons();
  return <WeaponsTable weapons={weapons} />;
}
