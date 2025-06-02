-- Add columns for secretary-doctor relationship
ALTER TABLE _user 
ADD COLUMN assigned_doctor_id INT,
ADD COLUMN cv_file_path VARCHAR(255),
ADD COLUMN secretary_status VARCHAR(20) DEFAULT 'NONE',
ADD CONSTRAINT fk_assigned_doctor FOREIGN KEY (assigned_doctor_id) REFERENCES _user(id);

-- Create index for assigned doctor lookup
CREATE INDEX idx_assigned_doctor ON _user(assigned_doctor_id);

-- Create index for secretary status
CREATE INDEX idx_secretary_status ON _user(secretary_status); 