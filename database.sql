CREATE DATABASE digitization;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    fullname TEXT NOT NULL,
    designation TEXT NOT NULL,
    password TEXT NOT NULL,
    roles TEXT NOT NULL,
    refresh_token TEXT,
    timestamp TEXT NOT NULL
);

CREATE TABLE Municipal_Records(
    recordId SERIAL PRIMARY KEY,
    wardNo TEXT NOT NULL,
    subDivNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
);
CREATE TABLE Birth_Records(
    recordId SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    fileLink TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE HouseTax_Records(
    recordId SERIAL PRIMARY KEY,
    wardNo TEXT NOT NULL,
    houseNo TEXT NOT NULL,
	name TEXT NOT NULL,
    fileLink TEXT NOT NULL,
	timestamp TEXT NOT NULL
);

CREATE TABLE ConstructionLicense_Records(
    recordId SERIAL PRIMARY KEY,
    licenseNo TEXT NOT NULL,
    subDivNo TEXT NOT NULL,
	year TEXT NOT NULL,
	name TEXT NOT NULL,
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

CREATE TABLE user_auditlogs(
    logId SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    loggedintime TEXT NOT NULL
);

-- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE users RESTART IDENTITY; 

-- psql -U postgres => login to psql
-- \c digitization  => switch to db
-- \dt
-- \d [table_name] => describe table schema