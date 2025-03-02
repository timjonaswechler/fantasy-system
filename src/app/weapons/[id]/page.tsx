// src/app/weapons/[id]/page.tsx
import { getWeaponById } from "@/actions/weapons";
import { WeaponDetail } from "@/components/weapons/weapon-detail";
import { notFound } from "next/navigation";

interface WeaponDetailPageProps {
  params: { id: string };
}

export default async function WeaponDetailPage({
  params,
}: WeaponDetailPageProps) {
  const weapon = await getWeaponById(params.id);

  if (!weapon) {
    notFound();
  }

  return <WeaponDetail weapon={weapon} />;
}
