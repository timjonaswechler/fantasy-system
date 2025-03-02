-- src/db/migrations/001_create_weapons_tables.sql

-- Create enum types for weapons
DO $$ BEGIN
    -- Create weapon_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weapon_type') THEN
        CREATE TYPE weapon_type AS ENUM ('MELEE', 'RANGED', 'THROWING');
    END IF;
    
    -- Create weapon_category enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weapon_category') THEN
        CREATE TYPE weapon_category AS ENUM (
            'DAGGER', 'SWORDS', 'MACES', 'SPEARS', 'AXES', 'FLAILS', 
            'CLEAVERS', 'HAMMERS', 'POLEARMS', 'BOWS', 'CROSSBOWS', 
            'FIREARMS', 'THROWING_WEAPONS', 'THROWABLE_ITEMS'
        );
    END IF;
    
    -- Create grasp_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grasp_type') THEN
        CREATE TYPE grasp_type AS ENUM ('ONE_HANDED', 'TWO_HANDED');
    END IF;
END $$;

-- Create the weapons table
CREATE TABLE IF NOT EXISTS weapons (
    id SERIAL PRIMARY KEY,
    weapon_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type weapon_type NOT NULL,
    category weapon_category NOT NULL,
    base_damage_min INTEGER,
    base_damage_max INTEGER,
    weight_min DECIMAL(5,2),
    weight_max DECIMAL(5,2),
    price INTEGER,
    material VARCHAR(255),
    durability INTEGER,
    properties TEXT[],
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookup by weapon_id
CREATE INDEX IF NOT EXISTS idx_weapons_weapon_id ON weapons(weapon_id);

-- Create weapon_grasp join table for the many-to-many relationship
CREATE TABLE IF NOT EXISTS weapon_grasp (
    weapon_id INTEGER REFERENCES weapons(id) ON DELETE CASCADE,
    grasp_type grasp_type NOT NULL,
    PRIMARY KEY (weapon_id, grasp_type)
);

-- Create weapon_range table for range data
CREATE TABLE IF NOT EXISTS weapon_range (
    id SERIAL PRIMARY KEY,
    weapon_id INTEGER REFERENCES weapons(id) ON DELETE CASCADE,
    precision_value INTEGER NOT NULL,
    distance INTEGER NOT NULL,
    UNIQUE (weapon_id, precision_value)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weapon_grasp_weapon_id ON weapon_grasp(weapon_id);
CREATE INDEX IF NOT EXISTS idx_weapon_range_weapon_id ON weapon_range(weapon_id);

-- Add trigger to update the 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_weapons_modtime ON weapons;
CREATE TRIGGER update_weapons_modtime
BEFORE UPDATE ON weapons
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();