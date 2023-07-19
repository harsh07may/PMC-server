-- psql -U postgres => login to psql
-- \c digitization  => switch to db
-- \dt
-- \d [table_name] => describe table schema
CREATE DATABASE digitization;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    fullname TEXT NOT NULL,
    password TEXT NOT NULL,
    refresh_token TEXT,
    timestamp timestamptz NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    admin BOOLEAN DEFAULT false,
    municipality_property_records TEXT DEFAULT 'deny',
    birth_records TEXT DEFAULT 'deny',
    death_records TEXT DEFAULT 'deny',
    construction_license_records TEXT DEFAULT 'deny',
    house_tax_records TEXT DEFAULT 'deny',
    trade_license_records TEXT DEFAULT 'deny',
    application_tracking TEXT DEFAULT 'deny',
    leave_management TEXT DEFAULT 'deny',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE Municipal_Records(
    recordId SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    surveyNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp timestamptz NOT NULL
);

CREATE TABLE Birth_Records(
    recordId SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp timestamptz NOT NULL
);

CREATE TABLE HouseTax_Records(
    recordId SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    houseNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp timestamptz NOT NULL
);

CREATE TABLE ConstructionLicense_Records(
    recordId SERIAL PRIMARY KEY,
    licenseNo TEXT NOT NULL,
    surveyNo TEXT NOT NULL,
    location TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp timestamptz NOT NULL
);

CREATE TABLE searchadd_auditlogs(
    logId SERIAL PRIMARY KEY,
    timestamp timestamptz NOT NULL,
    documentType TEXT NOT NULL,
    resourceName TEXT NOT NULL,
    Action TEXT NOT NULL,
    performedBy TEXT NOT NULL
);

CREATE TABLE admin_auditlogs(
    logId SERIAL PRIMARY KEY,
    timestamp timestamptz NOT NULL,
    Action TEXT NOT NULL,
    description TEXT NOT NULL,
    performedBy TEXT NOT NULL
);

CREATE TABLE TradeLicense_Records(
    recordId SERIAL PRIMARY KEY,
    licenseNo TEXT NOT NULL,
    location TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp timestamptz NOT NULL
);

CREATE TABLE Death_Records(
    recordId SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp timestamptz NOT NULL
);

ALTER TABLE
    municipal_records RENAME COLUMN wardNo TO surveyNo;

ALTER TABLE
    municipal_records RENAME COLUMN subDivNo TO location;

ALTER TABLE
    ConstructionLicense_Records RENAME COLUMN subDivNo TO surveyNo;

ALTER TABLE
    ConstructionLicense_Records RENAME COLUMN year TO location;

ALTER TABLE
    ConstructionLicense_Records RENAME COLUMN name TO title;

ALTER TABLE
    HouseTax_Records RENAME COLUMN wardNo TO location;

ALTER TABLE
    HouseTax_Records RENAME COLUMN name TO title;

-- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE Birth_Records RESTART IDENTITY;

ALTER TABLE
    Birth_Records
ADD
    COLUMN title TEXT NOT NULL;

ALTER TABLE
    users DROP COLUMN designation;

ALTER TABLE
    permissions
ADD
    COLUMN application_tracking TEXT DEFAULT 'deny';

ALTER TABLE
    permissions
ADD
    COLUMN leave_management TEXT DEFAULT 'deny';

-- CREATE TYPE leave_application_status AS ENUM (
--     'pending',
--     'rejected',
--     'manager-approved',
--     'hod-approved'
-- );


-- CREATE TYPE leave_application_type AS ENUM ('medical', 'casual');

-- CREATE TABLE leave_applications(
--     id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES users(user_id),
--     manager_id INT NOT NULL REFERENCES users(user_id),
--     hod_id INT NOT NULL REFERENCES users(user_id),
--     status leave_application_status NOT null DEFAULT 'pending',
--     type leave_application_type NOT NULL,
--     ctime DATE DEFAULT CURRENT_TIMESTAMP NOT NULL,
--     start_date DATE NOT NULL,
--     end_date DATE NOT NULL
-- ) 
-- DELETE ALL ENTRIES AND RESET ID
-- TRUNCATE TABLE users RESTART IDENTITY;

-- APPLICATION TRACKING
CREATE TABLE application(
    ref_id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    created_at timestamptz NOT NULL, 
    outwarded BOOLEAN DEFAULT false,
    holder TEXT NOT NULL DEFAULT 'central',
    notes TEXT NOT NULL DEFAULT '**PLEASE DO NOT CLEAR PREVIOUS NOTES**'
);

-- ALTER TABLE
--     application
-- ALTER notes TEXT DEFAULT "**PLEASE DON'T CLEAR PREVIOUS NOTES**" ;

CREATE TYPE application_status AS ENUM ('unseen', 'accepted', 'rejected');

CREATE TABLE application_trail(
    trail_id SERIAL PRIMARY KEY,
    ref_id TEXT NOT NULL REFERENCES application(ref_id) ON DELETE CASCADE,
    transfer_no INT NOT NULL,
    transfer_time timestamptz NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'unseen'
);

-- ALTER TABLE application_trail ADD FOREIGN KEY (ref_id) REFERENCES application(ref_id) ON DELETE CASCADE;

-- ALTER TABLE application_trail
-- ALTER COLUMN transfer_time TYPE timestamptz,
-- ALTER COLUMN transfer_time SET DEFAULT LOCALTIMESTAMP(3);

-- ALTER TABLE application
-- ALTER COLUMN created_at TYPE TEXT USING created_at::TEXT,
-- ALTER COLUMN created_at SET DEFAULT LOCALTIMESTAMP(3);


-- LEAVE MANAGEMENT 
CREATE TABLE leave(
    id SERIAL PRIMARY KEY,
    applicant_name TEXT NOT NULL,
    created_at timestamptz NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    leave_type TEXT NOT NULL,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL
);


-- ! TIMSTAMP FIX FOR ALL TABLE 

-- ALTER TABLE admin_auditlogs
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- TRUNCATE TABLE application CASCADE;
-- TRUNCATE TABLE application_trail;
-- TRUNCATE TABLE birth_records;
-- TRUNCATE TABLE death_records;
-- TRUNCATE TABLE constructionlicense_records;
-- TRUNCATE TABLE housetax_records;
-- TRUNCATE TABLE municipal_records;
-- TRUNCATE TABLE tradelicense_records;


-- ALTER TABLE application
-- -- DROP COLUMN created_at;
-- ADD COLUMN created_at timestamptz NOT NULL;

-- ALTER TABLE application_trail
-- -- DROP COLUMN transfer_time;
-- ADD COLUMN transfer_time timestamptz NOT NULL;

-- ALTER TABLE birth_records
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- ALTER TABLE death_records
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- ALTER TABLE constructionlicense_records
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- ALTER TABLE housetax_records
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- ALTER TABLE municipal_records
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- ALTER TABLE tradelicense_records
-- -- DROP COLUMN timestamp;
-- ADD COLUMN timestamp timestamptz NOT NULL;

-- ALTER TABLE users
-- -- -- DROP COLUMN timestamp;
-- ALTER COLUMN timestamp TYPE timestamptz USING "timestamp"::timestamp with time zone;
--! END 