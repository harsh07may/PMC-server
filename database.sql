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
    timestamp TEXT NOT NULL
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
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE Municipal_Records(
    recordId SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    surveyNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE Birth_Records(
    recordId SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE HouseTax_Records(
    recordId SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    houseNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE ConstructionLicense_Records(
    recordId SERIAL PRIMARY KEY,
    licenseNo TEXT NOT NULL,
    surveyNo TEXT NOT NULL,
    location TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE searchadd_auditlogs(
    logId SERIAL PRIMARY KEY,
    timestamp TEXT NOT NULL,
    documentType TEXT NOT NULL,
    resourceName TEXT NOT NULL,
    Action TEXT NOT NULL,
    performedBy TEXT NOT NULL
);

CREATE TABLE admin_auditlogs(
    logId SERIAL PRIMARY KEY,
    timestamp TEXT NOT NULL,
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
    timestamp TEXT NOT NULL
);

CREATE TABLE Death_Records(
    recordId SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
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

CREATE TYPE leave_application_status AS ENUM (
    'pending',
    'rejected',
    'manager-approved',
    'hod-approved'
);

ALTER TABLE
    permissions
ADD
    COLUMN application_tracking TEXT DEFAULT 'deny';

CREATE TYPE leave_application_type AS ENUM ('medical', 'casual');

CREATE TABLE leave_applications(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    manager_id INT NOT NULL REFERENCES users(user_id),
    hod_id INT NOT NULL REFERENCES users(user_id),
    status leave_application_status NOT null DEFAULT 'pending',
    type leave_application_type NOT NULL,
    ctime DATE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
) -- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE users RESTART IDENTITY;

-- APPLICATION TRACKING
CREATE TABLE application(
    ref_id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    created_at DATE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    outwarded BOOLEAN DEFAULT false,
    holder TEXT NOT NULL DEFAULT 'central',
    notes TEXT NOT NULL DEFAULT 'Do not delete this note'
);
ALTER TABLE
    application
ADD
    COLUMN notes TEXT DEFAULT 'Do not delete this note';

CREATE TYPE application_status AS ENUM ('unseen', 'accepted', 'rejected');

CREATE TABLE application_trail(
    trail_id SERIAL PRIMARY KEY,
    ref_id TEXT NOT NULL REFERENCES application(ref_id),
    transfer_no INT NOT NULL,
    transfer_time DATE NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'unseen'
);