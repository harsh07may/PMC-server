CREATE DATABASE digitization;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    fullname TEXT NOT NULL,
    designation TEXT NOT NULL,
    password TEXT NOT NULL,
    roles TEXT NOT NULL
);

CREATE TABLE document(
    doc_id SERIAL PRIMARY KEY,
    doc_name TEXT NOT NULL,
    doc_location TEXT NOT NULL,
    doc_type TEXT NOT NULL
);



CREATE TABLE Muncipal_Records(
    recordId SERIAL PRIMARY KEY,
    wardNo TEXT NOT NULL,
    subDivNo TEXT NOT NULL,
    title TEXT NOT NULL,
    fileLink TEXT,
);



-- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE users RESTART IDENTITY; 