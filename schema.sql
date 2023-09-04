DROP TABLE IF EXISTS facts;
DROP TABLE IF EXISTS scientists;
DROP TABLE IF EXISTS users;

CREATE TABLE scientists (
  id serial PRIMARY KEY,
  fullname text NOT NULL UNIQUE,
  birthdate text,
  birthplace text
);

CREATE TABLE facts (
  id serial PRIMARY KEY,
  fact text NOT NULL,
  scientist_id integer
    NOT NULL
    REFERENCES scientists (id)
    ON DELETE CASCADE,
  UNIQUE (scientist_id, fact)
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);