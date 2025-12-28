-- Add birthdate and username fields to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add comment
COMMENT ON COLUMN users.birthdate IS 'User birthdate';
COMMENT ON COLUMN users.username IS 'User display username';
