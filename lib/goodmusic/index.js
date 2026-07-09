const express = require('express');

const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const db = require('goodmusic/db/MongoDBService');
const crudRouter = require('goodmusic/db/crud.routes');
const authRouter = require('goodmusic/authentication/auth.routes');

const init = (config) => {
    const app = express();
    app.set('view engine', 'ejs');
    app.use(expressLayouts);
    app.set('layout', 'layout');

    // Middleware
    app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
    app.use(bodyParser.json({limit: "10mb"}));

    app.use(express.static(path.join(__dirname, '../../public')));

    if (config.db.uri != undefined) {
        db.init(config.db.uri).database(config.db.database);
    }
    
    app.use("/api/auth", authRouter);
    app.use('/api/', crudRouter(db));

    return app;
}
module.exports = init;
