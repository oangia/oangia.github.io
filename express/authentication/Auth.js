const bcrypt = require("bcrypt");
const JwtService = require("./JwtService");

class Auth {
  // hash password
  async bcrypt(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // verify password
  async validate_password(user_password, password) {
    return await bcrypt.compare(password, user_password);
  }

  jwt_generate(data, expiresIn, issuer) {
    const jwtService = new JwtService({
      secret: 'de5db2cb37a2b0d884d3a680e96b80baa99b7a267796db3f0ddeb183e63fc5aa5c8f52d25ba92bd1e10f1b090cecf10751e7a5891a5986112f2cb4d8d26665d5',
      expiresIn,
      issuer,
    });
    return jwtService.generate(data);
  }
}

module.exports = new Auth();