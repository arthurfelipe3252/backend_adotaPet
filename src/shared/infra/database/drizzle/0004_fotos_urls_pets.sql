-- Migration: substitui foto_url (string única) por fotos_urls (JSON array de URLs/base64)
-- Migra o valor existente de foto_url para dentro do array fotos_urls.

ALTER TABLE pets ADD COLUMN IF NOT EXISTS fotos_urls text;

-- Migra dados existentes: se havia foto_url, coloca ela como primeiro elemento do array
UPDATE pets
SET fotos_urls = '["' || foto_url || '"]'
WHERE foto_url IS NOT NULL AND foto_url != '';

-- Remove coluna antiga
ALTER TABLE pets DROP COLUMN IF EXISTS foto_url;
