-- Add acquisition_type field to player_salaries table
ALTER TABLE public.player_salaries 
ADD COLUMN acquisition_type TEXT DEFAULT 'contract';

-- Add check constraint for valid acquisition types
ALTER TABLE public.player_salaries 
ADD CONSTRAINT player_salaries_acquisition_type_check 
CHECK (acquisition_type IN ('contract', 'faab', 'free_agent'));

-- Create index for better performance on acquisition_type queries
CREATE INDEX idx_player_salaries_acquisition_type ON public.player_salaries(acquisition_type);

-- Update existing records to have 'contract' as default (they're already defaulted, but this is explicit)
UPDATE public.player_salaries 
SET acquisition_type = 'contract' 
WHERE acquisition_type IS NULL;