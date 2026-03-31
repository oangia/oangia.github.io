const jwt = require("jsonwebtoken");

class JwtService {
  constructor({ secret, expiresIn = "1h", issuer }) {
    if (!secret) throw new Error("JWT secret is required");
    this.secret = secret;
    this.expiresIn = expiresIn;
    this.issuer = issuer;
  }

  generate(payload) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: this.issuer,
    });
  }

  verify(token) {
    return jwt.verify(token, this.secret, {
      issuer: this.issuer,
    });
  }

  decode(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtService;