ALTER TABLE bilan_medical
ADD COLUMN amount_to_pay DECIMAL(10,2),
ADD COLUMN amount_paid DECIMAL(10,2),
ADD COLUMN profit DECIMAL(10,2),
ADD COLUMN remaining_to_pay DECIMAL(10,2); 