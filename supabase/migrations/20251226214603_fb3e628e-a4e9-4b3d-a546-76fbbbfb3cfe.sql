-- Add is_anonymous column to group_messages for anonymous messaging
ALTER TABLE public.group_messages 
ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;