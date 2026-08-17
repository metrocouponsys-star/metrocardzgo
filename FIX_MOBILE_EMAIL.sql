-- =============================================================================
-- FIX: Correct typo in mobile merchant user email
-- Run this in Supabase SQL Editor → New Query → Paste → Run
-- =============================================================================
-- Fix the wrong email 'mobile@metrocard.in' to 'mobile@metrocardz.in'
UPDATE merchant_users
SET email = 'mobile@metrocardz.in'
WHERE phone = '9876500016'
  AND email = 'mobile@metrocard.in';

-- Also clean up any duplicate entry with wrong email if it exists
DELETE FROM merchant_users
WHERE email = 'mobile@metrocard.in'
  AND phone != '9876500016';

-- Confirm the fix
SELECT id, name, phone, email, role
FROM merchant_users
WHERE phone = '9876500016' OR email IN ('mobile@metrocardz.in', 'mobile@metrocard.in');
