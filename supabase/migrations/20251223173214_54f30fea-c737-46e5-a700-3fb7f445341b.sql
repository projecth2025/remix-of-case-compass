-- Add profession and hospital_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profession text,
ADD COLUMN hospital_name text;