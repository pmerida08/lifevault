-- LifeVault — Sample Data
-- Run after 001_initial.sql

-- Demo user (password: demo1234)
INSERT INTO users (id, email, name, password_hash, plan)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'demo@lifevault.app',
  'Demo User',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- demo1234
  'premium'
) ON CONFLICT DO NOTHING;

-- Documents
INSERT INTO documents (user_id, title, category, file_url, file_name, file_size, mime_type, tags)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Pasaporte', 'legal', 'https://placeholder.s3/passport.pdf', 'passport.pdf', 512000, 'application/pdf', ARRAY['identidad', 'viaje']),
  ('a0000000-0000-0000-0000-000000000001', 'Análisis de sangre Q1 2026', 'health', 'https://placeholder.s3/blood_test.pdf', 'blood_test.pdf', 204800, 'application/pdf', ARRAY['salud', 'laboratorio']),
  ('a0000000-0000-0000-0000-000000000001', 'Declaración de renta 2025', 'finance', 'https://placeholder.s3/tax_2025.pdf', 'tax_2025.pdf', 1048576, 'application/pdf', ARRAY['impuestos', 'hacienda'])
ON CONFLICT DO NOTHING;

-- Tasks
INSERT INTO tasks (user_id, title, description, status, priority, due_date, tags)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Renovar seguro médico', 'Llamar a la aseguradora antes de fin de mes', 'todo', 'high', NOW() + INTERVAL '7 days', ARRAY['salud', 'urgente']),
  ('a0000000-0000-0000-0000-000000000001', 'Revisar inversiones', NULL, 'in_progress', 'medium', NOW() + INTERVAL '14 days', ARRAY['finanzas']),
  ('a0000000-0000-0000-0000-000000000001', 'Escanear documentos del coche', NULL, 'todo', 'low', NULL, ARRAY['vehículo'])
ON CONFLICT DO NOTHING;

-- Events
INSERT INTO events (user_id, title, description, start_at, end_at, all_day, color)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Revisión médica anual', 'Centro de salud San Roque', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', false, '#4d44e3'),
  ('a0000000-0000-0000-0000-000000000001', 'Reunión con gestor fiscal', NULL, NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '2 hours', false, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Vencimiento IRPF', NULL, NOW() + INTERVAL '30 days', NULL, true, '#f59e0b')
ON CONFLICT DO NOTHING;

-- Vault notes
INSERT INTO vault_notes (user_id, title, content, tags, is_pinned)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Contraseñas importantes', 'Gestor: Bitwarden. Clave maestra en papel en cajón izquierdo.', ARRAY['seguridad'], true),
  ('a0000000-0000-0000-0000-000000000001', 'Contactos de emergencia', 'Dr. García: +34 600 000 001 | Abogado: +34 600 000 002', ARRAY['contactos'], false)
ON CONFLICT DO NOTHING;
