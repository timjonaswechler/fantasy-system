// src/app/weapons/page.tsx
import { getWeapons } from "@/actions/weapons";
import { WeaponsTable } from "@/components/weapons/weapons-table";

export default async function WeaponsPage() {
  // Fetch weapons data from the server
  const weapons = await getWeapons();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Waffen</h1>
      <WeaponsTable weapons={weapons} />
    </div>
  );
}
