-- Add doctor professional info columns to _user table
ALTER TABLE _user
ADD COLUMN order_number VARCHAR(255),
ADD COLUMN cabinet_adresse VARCHAR(255),
ADD COLUMN ville VARCHAR(255); 