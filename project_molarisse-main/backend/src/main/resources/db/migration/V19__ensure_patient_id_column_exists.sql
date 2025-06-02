-- Check if patient_id column exists, if not add it
ALTER TABLE fiche_patient ADD COLUMN IF NOT EXISTS patient_id INTEGER;

-- Create an index on patient_id for better query performance
CREATE INDEX IF NOT EXISTS idx_fiche_patient_patient_id ON fiche_patient(patient_id);

-- Add foreign key constraint to users table (assuming users table has id column)
-- First drop the constraint if it exists
ALTER TABLE fiche_patient DROP FOREIGN KEY IF EXISTS fk_fiche_patient_patient;

-- Then add the constraint
ALTER TABLE fiche_patient 
ADD CONSTRAINT fk_fiche_patient_patient 
FOREIGN KEY (patient_id) REFERENCES users(id);

-- Update the column to NOT NULL if needed
-- Uncomment this if you want to make it required
-- ALTER TABLE fiche_patient MODIFY COLUMN patient_id INTEGER NOT NULL; 