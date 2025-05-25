-- Make appointment_id nullable in appointment_document table
ALTER TABLE appointment_document 
MODIFY COLUMN appointment_id INTEGER NULL; 