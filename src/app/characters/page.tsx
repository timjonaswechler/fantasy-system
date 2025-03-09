// src/app/characters/page.tsx
import { Shell } from "@/components/shell";
import dynamic from "next/dynamic";

// Dynamischer Import, da Three.js window benötigt (nur clientseitig verfügbar)
const MixamoViewer = dynamic(
  () => import("@/components/three/mixamo-viewer"),
  {}
);

export default function CharactersPage() {
  return (
    <Shell className="gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            3D Character Editor
          </h1>
          <p className="text-muted-foreground">
            Passe die Proportionen deines 3D-Charakters an
          </p>
        </div>
      </div>

      <MixamoViewer />
    </Shell>
  );
}
