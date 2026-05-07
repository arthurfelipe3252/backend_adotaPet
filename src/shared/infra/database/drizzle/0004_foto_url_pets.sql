-- Migration: adiciona coluna foto_url na tabela pets
-- Armazena a URL da foto principal do pet (base64 data-URI ou URL externa)

ALTER TABLE pets ADD COLUMN IF NOT EXISTS foto_url text;
