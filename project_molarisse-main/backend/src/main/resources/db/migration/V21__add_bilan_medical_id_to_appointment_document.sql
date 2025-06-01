ALTER TABLE appointment_document
  ADD COLUMN bilan_medical_id INTEGER NULL,
  ADD CONSTRAINT fk_appointment_document_bilan_medical
    FOREIGN KEY (bilan_medical_id) REFERENCES bilan_medical(id); 