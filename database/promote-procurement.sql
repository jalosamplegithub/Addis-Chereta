-- Promote the existing procurement username without changing its password.
-- Run after schema.sql. This is safe to run more than once.
BEGIN;

UPDATE users
SET role = 'procurement', updated_at = NOW()
WHERE LOWER(username) = LOWER('procurement')
  AND role = 'bidder';

INSERT INTO procurement_profiles (user_id, organization_name, department, job_title)
SELECT id, legal_name, 'Procurement', 'Procurement Officer'
FROM users
WHERE LOWER(username) = LOWER('procurement')
  AND role = 'procurement'
ON CONFLICT (user_id) DO NOTHING;

SELECT id, username, role, is_active
FROM users
WHERE LOWER(username) = LOWER('procurement');

COMMIT;
