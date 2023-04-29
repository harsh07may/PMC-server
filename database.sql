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

CREATE TABLE admin_auditlogs(
	logId SERIAL PRIMARY KEY,
	timestamp TEXT NOT NULL,
	Action TEXT NOT NULL,
	description TEXT NOT NULL,
	performedBy TEXT NOT NULL
);


CREATE TABLE user_auditlogs(
    logId SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    loggedintime TEXT NOT NULL
);

CREATE TABLE TradeLicense_Records(
    recordId SERIAL PRIMARY KEY,
	licenseNo TEXT NOT NULL,
    locality TEXT NOT NULL,
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

ALTER TABLE municipal_records RENAME COLUMN wardNo TO surveyNo;
ALTER TABLE municipal_records RENAME COLUMN subDivNo TO locality;

ALTER TABLE ConstructionLicense_Records RENAME COLUMN subDivNo TO surveyNo;

ALTER TABLE HouseTax_Records RENAME COLUMN wardNo TO locality;

ALTER TABLE Birth_Records ADD COLUMN title TEXT NOT NULL;


CREATE TYPE leave_application_status AS ENUM ('pending', 'rejected', 'manager-approved', 'hod-approved');
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
)

-- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE users RESTART IDENTITY; 

-- psql -U postgres => login to psql
-- \c digitization  => switch to db
-- \dt
-- \d [table_name] => describe table schema
