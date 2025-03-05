-- src/db/migrations/002_create_materials_tables.sql

-- Create enum types for materials
DO $$ BEGIN
    -- Create material_category enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_category') THEN
        CREATE TYPE material_category AS ENUM (
            'METAL', 'STONE', 'WOOD', 'FABRIC', 'LEATHER', 'BONE', 'GLASS', 
            'GEM', 'CLAY', 'ORGANIC', 'MAGICAL', 'LIQUID'
        );
    END IF;
    
    -- Create material_state enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_state') THEN
        CREATE TYPE material_state AS ENUM (
            'SOLID', 'LIQUID', 'GAS', 'POWDER', 'PASTE', 'PRESSED'
        );
    END IF;
END $$;

-- Create the materials table
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  material_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  density DECIMAL(10,3),
  value_modifier DECIMAL(10,2) DEFAULT 1.0,
  color VARCHAR(7),
  
  -- Physical properties
  impact_yield INTEGER,
  impact_fracture INTEGER,
  impact_strain_at_yield INTEGER,
  shear_yield INTEGER,
  shear_fracture INTEGER,
  shear_strain_at_yield INTEGER,
  
  -- Thermal properties
  melting_point INTEGER,
  boiling_point INTEGER,
  ignite_point INTEGER,
  specific_heat DECIMAL(10,3),
  
  -- Visual properties
  display_color VARCHAR(20),
  
  -- Flags
  is_metal BOOLEAN DEFAULT FALSE,
  is_stone BOOLEAN DEFAULT FALSE,
  is_gem BOOLEAN DEFAULT FALSE,
  is_organic BOOLEAN DEFAULT FALSE,
  is_fabric BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookup by material_id
CREATE INDEX IF NOT EXISTS idx_materials_material_id ON materials(material_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- Create material_properties table for extensible properties
CREATE TABLE IF NOT EXISTS material_properties (
  id SERIAL PRIMARY KEY,
  material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
  property_name VARCHAR(255) NOT NULL,
  property_value TEXT NOT NULL
);

-- Create material_states table
CREATE TABLE IF NOT EXISTS material_states (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    state_name material_state NOT NULL,
    state_description TEXT,
    state_color VARCHAR(50),
    UNIQUE (material_id, state_name)
);



-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_material_properties_material_id ON material_properties(material_id);
CREATE INDEX IF NOT EXISTS idx_material_states_material_id ON material_states(material_id);

-- Add trigger to update the 'updated_at' timestamp automatically
DROP TRIGGER IF EXISTS update_materials_modtime ON materials;
CREATE TRIGGER update_materials_modtime
BEFORE UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();