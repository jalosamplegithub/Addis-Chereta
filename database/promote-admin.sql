-- Promote one existing account to the system administrator role.
-- Replace the username below with the intended account before running.
-- The target account keeps its existing password and account details.
BEGIN;

UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE LOWER(username) = LOWER('REPLACE_WITH_ADMIN_USERNAME');

SELECT id, username, role, is_active
FROM users
WHERE LOWER(username) = LOWER('REPLACE_WITH_ADMIN_USERNAME');

COMMIT;
