// src/app/weapons/page.tsx
import { getWeapons } from "@/actions/weapons";
import { WeaponsDataTable } from "@/components/weapons/weapons-data-table";
import { Separator } from "@/components/ui/separator";

export default async function WeaponsPage() {
  // Fetch weapons data from the server
  const weapons = await getWeapons();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Waffen</h2>
        <p className="text-muted-foreground">Verwalte den Waffenkatalog</p>
      </div>

      <Separator />

      <WeaponsDataTable weapons={weapons} />
    </div>
  );
}
