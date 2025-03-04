// src/actions/material-transformations.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, mutate, transaction } from "@/lib/db";
import {
  MaterialTransformation,
  TransformationType,
  TransformationFormData,
  PerformTransformationParams,
  TransformationResult,
  TimeUnit,
} from "@/types/material-transformation";
import { getMaterialById } from "./materials";

// Server Action zum Abrufen aller Transformationen
export async function getTransformations(): Promise<MaterialTransformation[]> {
  try {
    // Get transformations from database
    const transformations = await query<any>(`
      SELECT 
        mt.id,
        mt.transformation_type as "type",
        mt.process_description as "description",
        mt.required_temperature as "requiredTemperature",
        mt.yield_percentage as "yieldPercentage",
        mt.required_tool as "requiredTool",
        mt.processing_time as "processingTime",
        mt.time_unit as "timeUnit",
        mt.additional_requirements as "additionalRequirements",
        mt.created_at as "createdAt",
        sm.material_id as "sourceMaterialId",
        sm.name as "sourceMaterialName",
        tm.material_id as "targetMaterialId",
        tm.name as "targetMaterialName"
      FROM material_transformations mt
      JOIN materials sm ON mt.source_material_id = sm.id
      JOIN materials tm ON mt.target_material_id = tm.id
      ORDER BY mt.created_at DESC
    `);

    // Map the database results to the MaterialTransformation interface
    return transformations.map((t) => ({
      id: t.id.toString(),
      sourceMaterial: {
        id: t.sourceMaterialId,
        name: t.sourceMaterialName,
      },
      targetMaterial: {
        id: t.targetMaterialId,
        name: t.targetMaterialName,
      },
      type: t.type as TransformationType,
      description: t.description || "",
      requiredTemperature: t.requiredTemperature,
      yieldPercentage: t.yieldPercentage,
      requiredTool: t.requiredTool,
      processingTime: t.processingTime,
      timeUnit: t.timeUnit as TimeUnit,
      additionalRequirements: t.additionalRequirements,
      createdAt: new Date(t.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching transformations:", error);
    throw new Error("Failed to fetch transformations");
  }
}

// Server Action zum Abrufen aller Transformationen für ein bestimmtes Material
export async function getTransformationsForMaterial(
  materialId: string
): Promise<MaterialTransformation[]> {
  try {
    // Get transformations from database where this material is source or target
    const transformations = await query<any>(
      `
      SELECT 
        mt.id,
        mt.transformation_type as "type",
        mt.process_description as "description",
        mt.required_temperature as "requiredTemperature",
        mt.yield_percentage as "yieldPercentage",
        mt.required_tool as "requiredTool",
        mt.processing_time as "processingTime",
        mt.time_unit as "timeUnit",
        mt.additional_requirements as "additionalRequirements",
        mt.created_at as "createdAt",
        sm.material_id as "sourceMaterialId",
        sm.name as "sourceMaterialName",
        tm.material_id as "targetMaterialId",
        tm.name as "targetMaterialName"
      FROM material_transformations mt
      JOIN materials sm ON mt.source_material_id = sm.id
      JOIN materials tm ON mt.target_material_id = tm.id
      WHERE sm.material_id = $1 OR tm.material_id = $1
      ORDER BY mt.created_at DESC
    `,
      [materialId]
    );

    // Map the database results to the MaterialTransformation interface
    return transformations.map((t) => ({
      id: t.id.toString(),
      sourceMaterial: {
        id: t.sourceMaterialId,
        name: t.sourceMaterialName,
      },
      targetMaterial: {
        id: t.targetMaterialId,
        name: t.targetMaterialName,
      },
      type: t.type as TransformationType,
      description: t.description || "",
      requiredTemperature: t.requiredTemperature,
      yieldPercentage: t.yieldPercentage,
      requiredTool: t.requiredTool,
      processingTime: t.processingTime,
      timeUnit: t.timeUnit as TimeUnit,
      additionalRequirements: t.additionalRequirements,
      createdAt: new Date(t.createdAt),
    }));
  } catch (error) {
    console.error(
      `Error fetching transformations for material ${materialId}:`,
      error
    );
    throw new Error("Failed to fetch transformations for material");
  }
}

// Server Action zum Abrufen aller Transformationen, bei denen ein Material als Quelle dient
export async function getSourceTransformationsForMaterial(
  materialId: string
): Promise<MaterialTransformation[]> {
  try {
    // Get transformations from database where this material is source
    const transformations = await query<any>(
      `
      SELECT 
        mt.id,
        mt.transformation_type as "type",
        mt.process_description as "description",
        mt.required_temperature as "requiredTemperature",
        mt.yield_percentage as "yieldPercentage",
        mt.required_tool as "requiredTool",
        mt.processing_time as "processingTime",
        mt.time_unit as "timeUnit",
        mt.additional_requirements as "additionalRequirements",
        mt.created_at as "createdAt",
        sm.material_id as "sourceMaterialId",
        sm.name as "sourceMaterialName",
        tm.material_id as "targetMaterialId",
        tm.name as "targetMaterialName"
      FROM material_transformations mt
      JOIN materials sm ON mt.source_material_id = sm.id
      JOIN materials tm ON mt.target_material_id = tm.id
      WHERE sm.material_id = $1
      ORDER BY mt.created_at DESC
    `,
      [materialId]
    );

    // Map the database results to the MaterialTransformation interface
    return transformations.map((t) => ({
      id: t.id.toString(),
      sourceMaterial: {
        id: t.sourceMaterialId,
        name: t.sourceMaterialName,
      },
      targetMaterial: {
        id: t.targetMaterialId,
        name: t.targetMaterialName,
      },
      type: t.type as TransformationType,
      description: t.description || "",
      requiredTemperature: t.requiredTemperature,
      yieldPercentage: t.yieldPercentage,
      requiredTool: t.requiredTool,
      processingTime: t.processingTime,
      timeUnit: t.timeUnit as TimeUnit,
      additionalRequirements: t.additionalRequirements,
      createdAt: new Date(t.createdAt),
    }));
  } catch (error) {
    console.error(
      `Error fetching source transformations for material ${materialId}:`,
      error
    );
    throw new Error("Failed to fetch source transformations for material");
  }
}

// Server Action zum Abrufen aller Transformationen, bei denen ein Material als Ziel dient
export async function getTargetTransformationsForMaterial(
  materialId: string
): Promise<MaterialTransformation[]> {
  try {
    // Get transformations from database where this material is target
    const transformations = await query<any>(
      `
      SELECT 
        mt.id,
        mt.transformation_type as "type",
        mt.process_description as "description",
        mt.required_temperature as "requiredTemperature",
        mt.yield_percentage as "yieldPercentage",
        mt.required_tool as "requiredTool",
        mt.processing_time as "processingTime",
        mt.time_unit as "timeUnit",
        mt.additional_requirements as "additionalRequirements",
        mt.created_at as "createdAt",
        sm.material_id as "sourceMaterialId",
        sm.name as "sourceMaterialName",
        tm.material_id as "targetMaterialId",
        tm.name as "targetMaterialName"
      FROM material_transformations mt
      JOIN materials sm ON mt.source_material_id = sm.id
      JOIN materials tm ON mt.target_material_id = tm.id
      WHERE tm.material_id = $1
      ORDER BY mt.created_at DESC
    `,
      [materialId]
    );

    // Map the database results to the MaterialTransformation interface
    return transformations.map((t) => ({
      id: t.id.toString(),
      sourceMaterial: {
        id: t.sourceMaterialId,
        name: t.sourceMaterialName,
      },
      targetMaterial: {
        id: t.targetMaterialId,
        name: t.targetMaterialName,
      },
      type: t.type as TransformationType,
      description: t.description || "",
      requiredTemperature: t.requiredTemperature,
      yieldPercentage: t.yieldPercentage,
      requiredTool: t.requiredTool,
      processingTime: t.processingTime,
      timeUnit: t.timeUnit as TimeUnit,
      additionalRequirements: t.additionalRequirements,
      createdAt: new Date(t.createdAt),
    }));
  } catch (error) {
    console.error(
      `Error fetching target transformations for material ${materialId}:`,
      error
    );
    throw new Error("Failed to fetch target transformations for material");
  }
}

// Server Action zum Erstellen einer neuen Transformation
export async function createTransformation(
  data: TransformationFormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    return await transaction(async (client) => {
      // Get internal IDs for source and target materials
      const sourceResult = await client.query(
        `SELECT id FROM materials WHERE material_id = $1`,
        [data.sourceMaterialId]
      );

      const targetResult = await client.query(
        `SELECT id FROM materials WHERE material_id = $1`,
        [data.targetMaterialId]
      );

      if (sourceResult.rows.length === 0) {
        return {
          success: false,
          error: `Source material with ID ${data.sourceMaterialId} not found`,
        };
      }

      if (targetResult.rows.length === 0) {
        return {
          success: false,
          error: `Target material with ID ${data.targetMaterialId} not found`,
        };
      }

      const sourceMaterialDbId = sourceResult.rows[0].id;
      const targetMaterialDbId = targetResult.rows[0].id;

      // Insert transformation into database
      const result = await client.query(
        `INSERT INTO material_transformations (
          source_material_id,
          target_material_id,
          transformation_type,
          process_description,
          required_temperature,
          yield_percentage,
          required_tool,
          processing_time,
          time_unit,
          additional_requirements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          sourceMaterialDbId,
          targetMaterialDbId,
          data.type,
          data.description,
          data.requiredTemperature,
          data.yieldPercentage,
          data.requiredTool,
          data.processingTime,
          data.timeUnit,
          data.additionalRequirements
            ? JSON.stringify(data.additionalRequirements)
            : null,
        ]
      );

      const transformationId = result.rows[0].id.toString();

      // Revalidate paths
      revalidatePath("/materials");
      revalidatePath(`/materials/${data.sourceMaterialId}`);
      revalidatePath(`/materials/${data.targetMaterialId}`);
      revalidatePath("/transformations");

      return { success: true, id: transformationId };
    });
  } catch (error) {
    console.error("Error creating transformation:", error);
    return { success: false, error: "Failed to create transformation" };
  }
}

// Server Action zum Durchführen einer Transformation (für Spielsystem oder Simulation)
export async function performTransformation(
  params: PerformTransformationParams
): Promise<TransformationResult> {
  try {
    // Get transformation details
    const transformations = await query<any>(
      `SELECT 
        mt.id,
        mt.transformation_type as "type",
        mt.process_description as "description",
        mt.required_temperature as "requiredTemperature",
        mt.yield_percentage as "yieldPercentage",
        mt.required_tool as "requiredTool",
        sm.material_id as "sourceMaterialId",
        tm.material_id as "targetMaterialId"
      FROM material_transformations mt
      JOIN materials sm ON mt.source_material_id = sm.id
      JOIN materials tm ON mt.target_material_id = tm.id
      WHERE mt.id = $1`,
      [params.transformationId]
    );

    if (transformations.length === 0) {
      return {
        success: false,
        error: `Transformation with ID ${params.transformationId} not found`,
      };
    }

    const transformation = transformations[0];

    // Get source and target materials
    const sourceMaterial = await getMaterialById(
      transformation.sourceMaterialId
    );
    const targetMaterial = await getMaterialById(
      transformation.targetMaterialId
    );

    if (!sourceMaterial || !targetMaterial) {
      return { success: false, error: "Source or target material not found" };
    }

    // Calculate yield amount
    const yieldAmount =
      (params.quantity * transformation.yieldPercentage) / 100;

    // In a real system, you'd update inventory here

    return {
      success: true,
      sourceMaterial,
      targetMaterial,
      yieldAmount,
    };
  } catch (error) {
    console.error(`Error performing transformation:`, error);
    return { success: false, error: "Failed to perform transformation" };
  }
}

// Server Action zum Löschen einer Transformation
export async function deleteTransformation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get source and target material ids for revalidation
    const transformations = await query<any>(
      `SELECT 
        sm.material_id as "sourceMaterialId",
        tm.material_id as "targetMaterialId"
      FROM material_transformations mt
      JOIN materials sm ON mt.source_material_id = sm.id
      JOIN materials tm ON mt.target_material_id = tm.id
      WHERE mt.id = $1`,
      [id]
    );

    if (transformations.length === 0) {
      return {
        success: false,
        error: `Transformation with ID ${id} not found`,
      };
    }

    const { sourceMaterialId, targetMaterialId } = transformations[0];

    // Delete transformation
    await mutate(`DELETE FROM material_transformations WHERE id = $1`, [id]);

    // Revalidate paths
    revalidatePath("/materials");
    revalidatePath(`/materials/${sourceMaterialId}`);
    revalidatePath(`/materials/${targetMaterialId}`);
    revalidatePath("/transformations");

    return { success: true };
  } catch (error) {
    console.error(`Error deleting transformation with ID ${id}:`, error);
    return { success: false, error: "Failed to delete transformation" };
  }
}
