// src/components/materials/tabs/basic-tab.tsx
"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { MaterialCategory } from "@/types/material";

interface BasicTabProps {
  form: UseFormReturn<any>;
  isReadOnly?: boolean;
}

export function BasicTab({ form, isReadOnly = false }: BasicTabProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Material name"
                {...field}
                disabled={isReadOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Material description"
                className="resize-none"
                {...field}
                disabled={isReadOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isReadOnly}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(MaterialCategory).map((category) => (
                  <SelectItem
                    key={category}
                    value={category}
                    className="capitalize"
                  >
                    {category.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Silver, Red"
                  {...field}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorHex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Hex</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="#RRGGBB"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <div
                  className="h-10 w-10 rounded-md border"
                  style={{
                    backgroundColor: field.value || "#888888",
                  }}
                ></div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="valueModifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value Modifier</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  {...field}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormDescription>Base value multiplier</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isMagical"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isReadOnly}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Magical</FormLabel>
                <FormDescription>Has magical properties</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRare"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isReadOnly}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Rare</FormLabel>
                <FormDescription>Hard to find material</FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Source Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="sourceLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Source location"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourceCreature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creature</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Source creature"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourcePlant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plant</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Source plant"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
