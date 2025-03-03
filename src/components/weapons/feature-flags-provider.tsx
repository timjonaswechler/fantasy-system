"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dataTableConfig } from "@/config/data-table";
import { cn } from "@/lib/utils";

type FeatureFlagValue = (typeof dataTableConfig.featureFlags)[number]["value"];

interface FeatureFlagsContextProps {
  featureFlags: FeatureFlagValue[];
  setFeatureFlags: (value: FeatureFlagValue[]) => void;
}

const FeatureFlagsContext = React.createContext<FeatureFlagsContextProps>({
  featureFlags: [],
  setFeatureFlags: () => {},
});

export function useFeatureFlags() {
  const context = React.useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider"
    );
  }
  return context;
}

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse flags from URL or use empty array as default
  const flagsParam = searchParams.get("flags");
  const initialFlags = flagsParam
    ? (flagsParam.split(",") as FeatureFlagValue[])
    : [];

  const [featureFlags, setFeatureFlags] =
    React.useState<FeatureFlagValue[]>(initialFlags);

  // Update URL when flags change
  const updateUrlWithFlags = React.useCallback(
    (flags: FeatureFlagValue[]) => {
      const params = new URLSearchParams(searchParams.toString());

      if (flags.length === 0) {
        params.delete("flags");
      } else {
        params.set("flags", flags.join(","));
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleFlagsChange = (newFlags: FeatureFlagValue[]) => {
    setFeatureFlags(newFlags);
    updateUrlWithFlags(newFlags);
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        featureFlags,
        setFeatureFlags: handleFlagsChange,
      }}
    >
      <div className="flex justify-end mb-4">
        <div className="w-full overflow-x-auto">
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={featureFlags}
            onValueChange={(value: FeatureFlagValue[]) =>
              handleFlagsChange(value)
            }
            className="w-fit gap-0 ml-auto"
          >
            {dataTableConfig.featureFlags.map((flag, index) => (
              <Tooltip key={flag.value}>
                <ToggleGroupItem
                  value={flag.value}
                  className={cn(
                    "gap-2 whitespace-nowrap rounded-none px-3 text-xs data-[state=on]:bg-accent/70 data-[state=on]:hover:bg-accent/90",
                    {
                      "rounded-l-sm border-r-0": index === 0,
                      "rounded-r-sm":
                        index === dataTableConfig.featureFlags.length - 1,
                    }
                  )}
                  asChild
                >
                  <TooltipTrigger>
                    <flag.icon
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {flag.label}
                  </TooltipTrigger>
                </ToggleGroupItem>
                <TooltipContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  className="flex max-w-60 flex-col space-y-1.5 border bg-background py-2 font-semibold text-foreground"
                >
                  <div>{flag.tooltipTitle}</div>
                  <div className="text-muted-foreground text-xs">
                    {flag.tooltipDescription}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
