-- Migration 0002 - Move foto de perfil de `usuarios` para as filhas e
-- adiciona documento comprobatório em `protetores_ongs`.
--
-- Motivação:
-- - Foto de perfil pertence ao perfil específico (adotante/protetor/ong),
--   não ao usuário-mãe. Manter em `usuarios` duplicaria dados ou exigiria
--   um esquema 1:N artificial.
-- - Protetores/ONGs precisam comprovar identidade/CNPJ via documento
--   (PDF ou imagem). Esse documento é privado da entidade filha — não
--   faz sentido em adotantes.
--
-- Sucede: 0001_initial_v2.sql

-- 1. usuarios deixa de armazenar imagem
ALTER TABLE usuarios DROP COLUMN imagem_base64;

-- 2. adotantes ganha foto de perfil em base64
ALTER TABLE adotantes ADD COLUMN imagem_base64 text;

-- 3. protetores_ongs:
--    - url_foto_perfil (varchar 500) vira imagem_base64 (text)
--    - ganha documento_comprobatorio (text, base64 PDF/imagem)
ALTER TABLE protetores_ongs RENAME COLUMN url_foto_perfil TO imagem_base64;
ALTER TABLE protetores_ongs ALTER COLUMN imagem_base64 TYPE text USING imagem_base64::text;
ALTER TABLE protetores_ongs ADD COLUMN documento_comprobatorio text;
