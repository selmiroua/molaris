-- Add document_type column to appointment_document table
ALTER TABLE appointment_document 
ADD COLUMN document_type VARCHAR(20) NOT NULL DEFAULT 'APPOINTMENT';

-- Update existing records based on their relationships
UPDATE appointment_document 
SET document_type = 'PATIENT' 
WHERE fiche_patient_id IS NOT NULL AND appointment_id IS NULL;

UPDATE appointment_document 
SET document_type = 'APPOINTMENT' 
WHERE appointment_id IS NOT NULL; 