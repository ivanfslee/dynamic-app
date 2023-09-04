let { Client } = require('pg');

// const express = require('express');
// const { queryDb } = require('./query-db');

// const app = express();

// app.use(async (req, res, next) => {
//   try { 
//     await res.locals.store.testQuery1();
//     await res.locals.store.testQuery2();
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// app.use(async (req, res, next) => {
//   try {
//     if (true) {
//       let query = 'INSERT INTO facts (scientist_id) VALUES ("sdfsdf")';
//       // await queryDb(query).catch(next);
//       await queryDb(query);

      
//     } else {
//       throw new Error('error is in else clause');
//     }
//   } catch (error) {
//     console.log('error is caught in catch clause');
//     next(error);
//   }
// });


// app.use((req, res, next) => {
//   console.log('middleware invoked');
//   next();
// });

// app.get('/lists', (req, res) => {
//   res.send('aloha');
// })


// app.use((err, req, res, next) => {
//   console.log('error handler runs');
//   console.log(err);
//   res.status(404).send(err.message);
// });


// app.listen(3002, 'localhost', () => {
//   console.log('Listening on port 3002');
// })


const express = require('express');
const app = express();

app.get('/', async (req, res, next) => {
  let configObj = {
    connectionString: 'postgresql://postgres:password@localhost/comp_sci_db'
  }
  let client = new Client(configObj);

  await client.connect();

  let queryStatement = 'SELECT * FROM scientists WHERE id = $1';
  let result = await client.query(queryStatement, [2]);

  await client.end();
  console.log(result);
  // res.send(result.rows[0]);
  res.send('aloha');
})

app.listen(3000, 'localhost', () => {
  console.log('app is listening on port 3000');
})
