// src/app/materials/page.tsx
import * as React from "react";
import { getMaterials } from "@/actions/materials";
import { MaterialsTable } from "@/components/materials/materials-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  return (
    <Shell className="gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materialien</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Materialdatenbank
          </p>
        </div>
      </div>

      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            searchableColumnCount={1}
            filterableColumnCount={2}
            cellWidths={[
              "10rem",
              "8rem",
              "8rem",
              "6rem",
              "6rem",
              "6rem",
              "8rem",
              "8rem",
            ]}
            shrinkZero
          />
        }
      >
        <MaterialsTableWrapper />
      </React.Suspense>
    </Shell>
  );
}

// Separate Komponente zum Abrufen der Daten innerhalb der Suspense-Boundary
async function MaterialsTableWrapper() {
  const materials = await getMaterials();
  return <MaterialsTable materials={materials} />;
}
