-- Fix UUID schema issue
-- Drop foreign key constraint first
ALTER TABLE public.mensagens DROP CONSTRAINT IF EXISTS mensagens_id_conversa_fk_fkey;

-- Change id_conversa_fk from UUID to TEXT
ALTER TABLE public.mensagens ALTER COLUMN id_conversa_fk TYPE TEXT;

-- Recreate foreign key constraint
ALTER TABLE public.mensagens 
ADD CONSTRAINT mensagens_id_conversa_fk_fkey 
FOREIGN KEY (id_conversa_fk) REFERENCES public.conversas(id_conversa) ON DELETE CASCADE;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mensagens' AND table_schema = 'public';

