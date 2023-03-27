CREATE DATABASE digitization;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    fullname TEXT NOT NULL,
    designation TEXT NOT NULL,
    password TEXT NOT NULL,
    roles TEXT NOT NULL,
    refresh_token TEXT
);

CREATE TABLE Municipal_Records(
    recordId SERIAL PRIMARY KEY,
    wardNo TEXT NOT NULL,
    subDivNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT
);
CREATE TABLE Birth_Records(
    recordId SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    year TEXT NOT NULL
    fileLink TEXT
);

-- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE users RESTART IDENTITY; 

-- psql -U postgres => login to psql
-- \c digitization  => switch to db
-- \dt