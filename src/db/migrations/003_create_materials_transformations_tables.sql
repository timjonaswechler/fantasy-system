-- src/db/migrations/003_create_materials_transformations_tables.sql

-- Create enum types for transformations and time units
DO $$ BEGIN
    -- Create transformation_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transformation_type') THEN
        CREATE TYPE transformation_type AS ENUM (
            'SMELTING', 'ALLOYING', 'TANNING', 'CUTTING', 
            'GRINDING', 'CRAFTING', 'MAGICAL'
        );
    END IF;
    
    -- Create time_unit enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_unit') THEN
        CREATE TYPE time_unit AS ENUM (
            'MINUTES', 'HOURS', 'DAYS'
        );
    END IF;
END $$;

-- Create material transformations table
CREATE TABLE IF NOT EXISTS material_transformations (
    id SERIAL PRIMARY KEY,
    source_material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    target_material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    transformation_type transformation_type NOT NULL,
    process_description TEXT,
    required_temperature INTEGER,
    yield_percentage INTEGER NOT NULL DEFAULT 100,
    required_tool VARCHAR(100),
    
    -- Time requirements
    processing_time INTEGER,
    time_unit time_unit,
    
    -- Additional requirements (stored as JSON)
    additional_requirements JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for material transformations
CREATE INDEX IF NOT EXISTS idx_transformations_source_material ON material_transformations(source_material_id);
CREATE INDEX IF NOT EXISTS idx_transformations_target_material ON material_transformations(target_material_id);

-- Create composite materials table
CREATE TABLE IF NOT EXISTS composite_materials (
    id SERIAL PRIMARY KEY,
    composite_material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create composite components table
CREATE TABLE IF NOT EXISTS composite_components (
    id SERIAL PRIMARY KEY,
    composite_id INTEGER REFERENCES composite_materials(id) ON DELETE CASCADE,
    component_material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    percentage DECIMAL(5, 2) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    
    -- Property influence (stored as JSON)
    property_influence JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for composite materials
CREATE INDEX IF NOT EXISTS idx_composite_materials_material ON composite_materials(composite_material_id);
CREATE INDEX IF NOT EXISTS idx_composite_components_composite ON composite_components(composite_id);
CREATE INDEX IF NOT EXISTS idx_composite_components_material ON composite_components(component_material_id);

-- Add triggers to update the 'updated_at' timestamp automatically
DROP TRIGGER IF EXISTS update_material_transformations_modtime ON material_transformations;
CREATE TRIGGER update_material_transformations_modtime
BEFORE UPDATE ON material_transformations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_composite_materials_modtime ON composite_materials;
CREATE TRIGGER update_composite_materials_modtime
BEFORE UPDATE ON composite_materials
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add 'is_composite' column to materials table
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS is_composite BOOLEAN DEFAULT false;