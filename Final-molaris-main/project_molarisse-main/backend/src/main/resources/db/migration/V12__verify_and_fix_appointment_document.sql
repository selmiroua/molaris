-- Drop existing foreign key constraints if they exist
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS FK_appointment_document_appointment;
ALTER TABLE appointment_document DROP FOREIGN KEY IF EXISTS FK_appointment_document_fiche_patient;

-- Drop existing table if it exists
DROP TABLE IF EXISTS appointment_document;

-- Recreate the table with correct constraints
CREATE TABLE appointment_document (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    appointment_id INTEGER,
    fiche_patient_id INTEGER,
    document_type VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    creation_date DATETIME NOT NULL,
    modification_date DATETIME,
    upload_date DATETIME NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointment(id),
    FOREIGN KEY (fiche_patient_id) REFERENCES fiche_patient(id)
); 