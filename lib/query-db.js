const config = require("./config");
const { Client } = require("pg");

const logQuery = (statement, parameters) => {
  let timeStamp = new Date();
  let formattedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
};

const CONNECTION = {
  connectionString: config.DATABASE_URL
};

module.exports = {
  async queryDb(statement, ...parameters) {
    let client = new Client(CONNECTION);
    await client.connect();
    logQuery(statement, parameters);
    let result = await client.query(statement, parameters);
    await client.end();

    return result;
  }
};
