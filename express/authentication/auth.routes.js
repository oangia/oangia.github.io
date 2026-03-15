const router = require("express").Router();
const db = require("@oangia/services/db/v1.0.0/MongoDBService");
const Auth = require("@oangia/services/authentication/v1.0.0/Auth");
const Validator = require("@oangia/services/validation/Validator");

router.post("/register", async (req, res) => {
    const validator = Validator.make(
        req.body,
        { email: "required|email", password: "required|min:6" }
    );
      
    if (validator.fails()) {
        return res.status(400).json({'errors': validator.errors()});
    }

    req.body.password = await Auth.bcrypt(req.body.password);
    const result = await db.create("users", req.body);
    res.json(result);
});

router.post('/login', async (req, res) => {
    const user = await db.find("users", {"email": req.body.email});

    if (! user || ! await Auth.validate_password(user.password, req.body.password)) {
        res.status(400).json({'errors': {'password': ['Email hoặc mật khẩu không chính xác!']}});
        return;
    }

    const token = Auth.jwt_generate(user, "7d", "nhathuynh");
    res.json({"token": token});
});

module.exports = router;