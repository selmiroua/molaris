-- Update document paths in fiche_patient table
UPDATE fiche_patient 
SET document_path = CONCAT('documents/', document_path) 
WHERE document_path IS NOT NULL 
AND document_path NOT LIKE 'documents/%';

-- Update document paths in appointment_document table
UPDATE appointment_document 
SET file_path = CONCAT('documents/', file_path) 
WHERE file_path IS NOT NULL 
AND file_path NOT LIKE 'documents/%'; 