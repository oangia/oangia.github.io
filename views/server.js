
const service = require("@oangia/services");
const crud = (app, collection) => {
    app.get('/admin/' + collection, (req, res) => {
        res.render('admin/' + collection + '/index');
    });

    app.get('/admin/' + collection + '/create', (req, res) => {
        res.render('admin/' + collection + '/create');
    });

    app.get('/admin/' + collection + '/:id', (req, res) => {
        res.render('admin/' + collection + '/edit', {id: req.params.id});
    });
}
const app = service.getApp({
    database: {
        uri: 'mongodb+srv://hqnhatdn:abc123$$@cluster0.wnkrqan.mongodb.net/?appName=Cluster0',
        dbname: 'mydb'
    }
});

app.get('/', async (req, res) => {
    res.locals.layout = 'layouts/site'; // Use the site layout
    res.render('index');
});

app.use((req, res, next) => {
    res.locals.layout = 'layouts/admin/layout';
    next();
});

app.get('/admin/login', (req, res) => {
    res.render('admin/login', { layout: false });
});
app.get('/admin', (req, res) => {
    res.render('admin/dashboard');
});
app.get('/admin/settings', (req, res) => {
    res.render('admin/settings');
});
crud(app, "users");
crud(app, "posts");
crud(app, "pages");
crud(app, "bookings");
app.listen(4000, () => {console.log(`http://localhost:4000/`);});


