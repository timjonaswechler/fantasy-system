// src/app/weapons/[id]/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function WeaponNotFound() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold mb-4">Waffe nicht gefunden</h1>
        <p className="mb-6">
          Die gesuchte Waffe existiert nicht oder wurde entfernt.
        </p>
        <Button asChild>
          <Link href="/weapons">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Übersicht
          </Link>
        </Button>
      </div>
    </div>
  );
}
