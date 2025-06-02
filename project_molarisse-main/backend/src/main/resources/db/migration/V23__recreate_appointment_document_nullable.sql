-- Drop all foreign key constraints
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS fk_appointment_document_appointment;
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS fk_appointment_document_fiche_patient;
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS fk_appointment_document_bilan_medical;

-- Drop the table
DROP TABLE IF EXISTS appointment_document;

-- Recreate the table with proper nullable constraints
CREATE TABLE appointment_document (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    appointment_id INTEGER NULL,
    fiche_patient_id INTEGER NULL,
    bilan_medical_id INTEGER NULL,
    document_type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    creation_date DATETIME NOT NULL,
    modification_date DATETIME NULL,
    upload_date DATETIME NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointment(id),
    FOREIGN KEY (fiche_patient_id) REFERENCES fiche_patient(id),
    FOREIGN KEY (bilan_medical_id) REFERENCES bilan_medical(id)
); 