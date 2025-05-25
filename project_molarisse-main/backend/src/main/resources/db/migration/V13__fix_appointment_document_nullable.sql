-- First, drop the existing table if it exists
DROP TABLE IF EXISTS appointment_document;

-- Create the table with correct nullable constraints
CREATE TABLE appointment_document (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    appointment_id INTEGER NULL,
    fiche_patient_id INTEGER NULL,
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