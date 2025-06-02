-- Add document fields to fiche_patient table
ALTER TABLE fiche_patient 
ADD COLUMN document_name VARCHAR(255),
ADD COLUMN document_path VARCHAR(255),
ADD COLUMN document_type VARCHAR(100),
ADD COLUMN document_size BIGINT,
ADD COLUMN document_upload_date DATETIME; 