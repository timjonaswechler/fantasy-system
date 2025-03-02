// src/app/weapons/page.tsx
import { getWeapons } from "@/actions/weapons";
import { WeaponsList } from "@/components/weapons/weapons-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function WeaponsPage() {
  // Fetch weapons data from the server
  const weapons = await getWeapons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Waffen</h2>
          <p className="text-muted-foreground">Verwalte den Waffenkatalog</p>
        </div>
        <Button asChild>
          <Link href="/weapons/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Waffe hinzufügen
          </Link>
        </Button>
      </div>

      <Separator />

      <WeaponsList initialWeapons={weapons} />
    </div>
  );
}
