-- First, drop all foreign key constraints
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS fk_appointment_document_appointment;
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS fk_appointment_document_fiche_patient;

-- Drop the table if it exists
DROP TABLE IF EXISTS appointment_document;

-- Create the table with the correct structure
CREATE TABLE appointment_document (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    appointment_id INTEGER NULL,
    fiche_patient_id INTEGER NULL,
    document_type VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    creation_date DATETIME NOT NULL,
    modification_date DATETIME,
    upload_date DATETIME NOT NULL
);

-- Add foreign key constraints
ALTER TABLE appointment_document 
    ADD CONSTRAINT fk_appointment_document_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointment(id);

ALTER TABLE appointment_document 
    ADD CONSTRAINT fk_appointment_document_fiche_patient 
    FOREIGN KEY (fiche_patient_id) REFERENCES fiche_patient(id); 