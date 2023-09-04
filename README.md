## About The Project

I wanted to know more about the pioneers of computer science, so I decided to build an application to help me with that.

The application allows me to add an individual's name along with some basic details like their birthplace and birthdate. For each individual, I can add facts containing tidbits of information I want to remember.

From the seed data, I have been liberal and included individuals who are not strictly computer scientists, but could be considered tech personalities/programmers instead. In any case, all these individuals have contributed to the field of computer science, programming, and software development in some way.

---
## Software Versions 

These are the software versions I used to develop and test this application.

- Browser: Firefox version 106.0.1 (64-bit)
- Node.js v16.13.0
- PostgreSQL 14.4, Build 1914, 64-bit  

---

## Installation and Configuration

1. Unzip the files into a project directory folder.

2. From the project directory in your terminal, install the NPM packages using:

```sh
npm install
```

3. Create a new database in PostgreSQL to be used with this project.

For example: 
```sh
createdb comp_sci_db;
```

4. Run the three included SQL files, (`schema.sql`, `seed-data.sql`, `users.sql`) to create the tables and fill them with seed data.

```sh
psql -d comp_sci_db < schema.sql
psql -d comp_sci_db < lib/seed-data.sql
psql -d comp_sci_db < lib/users.sql
```

5. Configure your various settings in the `.env` file.

- The `SECRET` value is used to encrypt session cookies.

- The `DATABASE_URL` value is the URL of the database created in step 3.
  - e.g. `postgresql://localhost/comp_sci_db`

- The `HOST` value is the host of your application.
  - e.g. `localhost`

- The `PORT` value is an available port that can listen for connections.
  - e.g. `3000`


`.env` file example:
```
SECRET="your secret here"
DATABASE_URL="postgresql://localhost/comp_sci_db"
HOST="localhost"
PORT="3000"
```

6. Start up the node application server:

```sh
npm start
```

7. You should now be able to access the application in your browser using the host and port.
e.g. `localhost:3000`

8. You can sign in to the application using `admin` as the username and `secret` as the password.
---
