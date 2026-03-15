const db = require("./db/MongoDBService");

function init(config) {
  if (!config) {
    throw new Error("Config is required for initialization");
  }

  db.init(config.database.uri).database(config.database.dbname);
}

module.exports = {
  init
};
