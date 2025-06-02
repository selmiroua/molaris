-- Drop the existing foreign key constraint
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS fk_appointment_document_appointment;

-- Modify the appointment_id column to be nullable
ALTER TABLE appointment_document MODIFY COLUMN appointment_id INTEGER NULL;

-- Add back the foreign key constraint
ALTER TABLE appointment_document ADD CONSTRAINT fk_appointment_document_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointment(id); 