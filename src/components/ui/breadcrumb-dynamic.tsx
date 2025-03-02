"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
// import { CreatureService } from "@/lib/services/creature-service";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

// This function will generate breadcrumbs with custom labels when applicable
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split("/").filter(Boolean);

  return paths.map((path, index) => {
    const href = "/" + paths.slice(0, index + 1).join("/");
    let label = path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // // Check if this is a creature ID path and replace with creature name if possible
    // if (paths[index - 1] === "creature" && path.length > 8) {
    //   try {
    //     // Nur auf der Client-Seite versuchen, die Kreatur zu laden
    //     if (typeof window !== "undefined") {
    //       const creature = CreatureService.getCreatureById(path);
    //       if (creature) {
    //         label = creature.name;
    //       }
    //     }
    //   } catch (error) {
    //     // If there's any error, just use the default label
    //     console.error("Error fetching creature for breadcrumb:", error);
    //   }
    // }

    return {
      label,
      href,
      isCurrent: index === paths.length - 1,
    };
  });
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  // Zustandsvariable für die Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

  // useEffect, um sicherzustellen, dass der Code nur auf der Client-Seite ausgeführt wird
  React.useEffect(() => {
    setBreadcrumbs(generateBreadcrumbs(pathname));
  }, [pathname]);

  if (breadcrumbs.length <= 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.href}>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem className="hidden sm:block">
              {breadcrumb.isCurrent ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={breadcrumb.href}>
                  {breadcrumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
