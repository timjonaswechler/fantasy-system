// AttributeDisplay.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Entity } from '@/engine/ecs';
import { AttributesComponent } from '@/engine/components/attributes-component';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AttributeDisplayProps {
  entityId: Entity | null;
  ecs: any; // The ECS instance
}

export function AttributeDisplay({ entityId, ecs }: AttributeDisplayProps) {
  if (entityId === null || !ecs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No entity selected</p>
        </CardContent>
      </Card>
    );
  }

  try {
    // Get components for this entity
    const components = ecs.getComponents(entityId);
    
    if (!components.has(AttributesComponent)) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No attributes available</p>
          </CardContent>
        </Card>
      );
    }
    
    const attributesComponent = components.get(AttributesComponent);
    
    // Group attributes by category
    const physicalAttributes = [
      "STRENGTH", "AGILITY", "TOUGHNESS", "ENDURANCE", 
      "RECUPERATION", "DISEASE_RESISTANCE"
    ];
    
    const mentalAttributes = [
      "ANALYTICAL_ABILITY", "FOCUS", "WILLPOWER", "CREATIVITY", 
      "INTUITION", "PATIENCE", "MEMORY"
    ];
    
    const socialAttributes = [
      "LINGUISTIC_ABILITY", "SPATIAL_SENSE", "MUSICALITY",
      "KINESTHETIC_SENSE", "EMPATHY", "SOCIAL_AWARENESS"
    ];

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Entity #{entityId} Attributes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="physical">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="physical" className="flex-1">Physical</TabsTrigger>
              <TabsTrigger value="mental" className="flex-1">Mental</TabsTrigger>
              <TabsTrigger value="social" className="flex-1">Social</TabsTrigger>
            </TabsList>
            
            <TabsContent value="physical" className="mt-0 p-4">
              <ScrollArea className="h-[400px] pr-3">
                {physicalAttributes.map(attrName => (
                  <div key={attrName} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {attrName.replace(/_/g, ' ')}
                      </span>
                      <span className={getAttributeColorClass(attributesComponent.getAttribute(attrName))}>
                        {attributesComponent.getAttribute(attrName)}
                        {attributesComponent.getAttributeDescription(attrName) && 
                          ` (${attributesComponent.getAttributeDescription(attrName)})`}
                      </span>
                    </div>
                    <Progress 
                      value={attributesComponent.getAttribute(attrName)} 
                      max={5000}
                      className="h-2"
                    />
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="mental" className="mt-0 p-4">
              <ScrollArea className="h-[400px] pr-3">
                {mentalAttributes.map(attrName => (
                  <div key={attrName} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {attrName.replace(/_/g, ' ')}
                      </span>
                      <span className={getAttributeColorClass(attributesComponent.getAttribute(attrName))}>
                        {attributesComponent.getAttribute(attrName)}
                        {attributesComponent.getAttributeDescription(attrName) && 
                          ` (${attributesComponent.getAttributeDescription(attrName)})`}
                      </span>
                    </div>
                    <Progress 
                      value={attributesComponent.getAttribute(attrName)} 
                      max={5000}
                      className="h-2"
                    />
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="social" className="mt-0 p-4">
              <ScrollArea className="h-[400px] pr-3">
                {socialAttributes.map(attrName => (
                  <div key={attrName} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {attrName.replace(/_/g, ' ')}
                      </span>
                      <span className={getAttributeColorClass(attributesComponent.getAttribute(attrName))}>
                        {attributesComponent.getAttribute(attrName)}
                        {attributesComponent.getAttributeDescription(attrName) && 
                          ` (${attributesComponent.getAttributeDescription(attrName)})`}
                      </span>
                    </div>
                    <Progress 
                      value={attributesComponent.getAttribute(attrName)} 
                      max={5000}
                      className="h-2"
                    />
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading entity attributes</p>
          <p className="text-xs text-muted-foreground">{String(error)}</p>
        </CardContent>
      </Card>
    );
  }
}

// Helper function to get color class based on attribute value
function getAttributeColorClass(value: number): string {
  if (value >= 2000) return "text-green-600 font-semibold";
  if (value >= 1500) return "text-green-500";
  if (value >= 1250) return "text-blue-500";
  if (value >= 1000) return "text-blue-400";
  if (value >= 750) return "text-gray-500";
  if (value >= 500) return "text-yellow-500";
  if (value >= 250) return "text-orange-500";
  return "text-red-500";
}