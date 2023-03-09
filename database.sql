CREATE DATABASE digitization;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE content(
    content_id SERIAL PRIMARY KEY,
    content_desc VARCHAR(255)
    refresh_token VARCHAR(255)
);



-- DELETE ALL ENTRIES AND RESET ID
TRUNCATE TABLE users RESTART IDENTITY; 