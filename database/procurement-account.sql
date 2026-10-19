-- Run after schema.sql to create the first procurement login.
-- Change every sample value, use an unused username and set a strong password.
-- pgcrypto's bcrypt output is compatible with the application's bcrypt login.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH new_procurement_user AS (
    INSERT INTO users (
        first_name,
        last_name,
        legal_name,
        email,
        phone,
        gender,
        username,
        password_hash,
        preferred_language,
        role
    ) VALUES (
        'Procurement',
        'Officer',
        'Your institution',
        'procurement@example.gov.et',
        '+251900000000',
        'prefer_not_to_say',
        'procurement',
        crypt('CHANGE_THIS_STRONG_PASSWORD', gen_salt('bf', 12)),
        'en',
        'procurement'
    )
    RETURNING id
)
INSERT INTO procurement_profiles (user_id, organization_name, department, job_title)
SELECT id, 'Your institution', 'Procurement', 'Procurement Officer'
FROM new_procurement_user
RETURNING user_id;
