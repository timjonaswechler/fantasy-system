// src/app/weapons/[id]/edit/page.tsx
import { getWeaponById } from "@/actions/weapons";
import { WeaponForm } from "@/components/weapons/weapon-form";
import { notFound } from "next/navigation";

interface EditWeaponPageProps {
  params: { id: string };
}

export default async function EditWeaponPage({ params }: EditWeaponPageProps) {
  const weapon = await getWeaponById(params.id);

  if (!weapon) {
    notFound();
  }

  return <WeaponForm mode="edit" initialData={weapon} />;
}
