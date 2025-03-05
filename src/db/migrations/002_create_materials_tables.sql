-- src/db/migrations/002_create_materials_tables.sql

-- Erstelle Enums für Material-Kategorien und -Zustände, falls sie noch nicht existieren
DO $$ BEGIN
    -- Erstelle material_category enum, wenn es nicht existiert
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_category') THEN
        CREATE TYPE material_category AS ENUM (
            'METAL', 'STONE', 'WOOD', 'BONE', 'LEATHER', 'CLOTH', 
            'GEM', 'GLASS', 'CERAMIC', 'LIQUID', 'GAS', 'OTHER'
        );
    END IF;
    
    -- Erstelle material_state enum, wenn es nicht existiert
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_state') THEN
        CREATE TYPE material_state AS ENUM (
            'SOLID', 'LIQUID', 'GAS', 'POWDER', 'PASTE', 'PRESSED'
        );
    END IF;
END $$;

-- Erstelle Haupttabelle für Materialien
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    material_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category material_category NOT NULL,
    description TEXT,
    density DECIMAL(10, 2), -- kg/m³
    value_modifier DECIMAL(10, 2) DEFAULT 1.0,
    
    -- Physikalische Eigenschaften
    impact_yield DECIMAL(10, 2),
    impact_fracture DECIMAL(10, 2),
    impact_strain_at_yield DECIMAL(10, 2),
    shear_yield DECIMAL(10, 2),
    shear_fracture DECIMAL(10, 2),
    shear_strain_at_yield DECIMAL(10, 2),
    
    -- Thermische Eigenschaften
    melting_point DECIMAL(10, 2),
    boiling_point DECIMAL(10, 2),
    ignite_point DECIMAL(10, 2),
    specific_heat DECIMAL(10, 2),
    
    -- Visuelle Eigenschaften
    display_color VARCHAR(20) DEFAULT '#CCCCCC',
    
    -- Kategorische Flags
    is_metal BOOLEAN DEFAULT false,
    is_stone BOOLEAN DEFAULT false,
    is_gem BOOLEAN DEFAULT false,
    is_organic BOOLEAN DEFAULT false,
    is_fabric BOOLEAN DEFAULT false,
    
    -- Zeitstempel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Erstelle Index für schnellere Suche
CREATE INDEX IF NOT EXISTS idx_materials_material_id ON materials(material_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- Erstelle Tabelle für erweiterte Materialeigenschaften
CREATE TABLE IF NOT EXISTS material_properties (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean'
    UNIQUE (material_id, key)
);

-- Erstelle Index für Materialeigenschaften
CREATE INDEX IF NOT EXISTS idx_material_properties_material_id ON material_properties(material_id);

-- Tabelle für Materialzustände (optional, für verschiedene Aggregatzustände eines Materials)
CREATE TABLE IF NOT EXISTS material_states (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    state material_state NOT NULL,
    state_description TEXT,
    transition_temperature DECIMAL(10, 2), -- Temperatur für den Übergang von/zu diesem Zustand
    transition_energy DECIMAL(10, 2),      -- Benötigte Energie für den Zustandsübergang
    UNIQUE (material_id, state)
);

-- Trigger für Aktualisierung des updated_at Zeitstempels
CREATE OR REPLACE FUNCTION update_material_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_materials_modtime ON materials;
CREATE TRIGGER update_materials_modtime
BEFORE UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION update_material_modified_column();