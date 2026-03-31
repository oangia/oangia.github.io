const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require("@oangia/services/db/MongoDBService");
const crudRouter = require("@oangia/services/db/crud.routes");

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use("/api/v1.0.0/auth", require("./authentication/auth.routes"));
app.use("/api/v1.0.0/", crudRouter(db));

module.exports = app;

