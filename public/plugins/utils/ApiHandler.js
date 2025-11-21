class ApiHandler {
    constructor(baseUrl) {
      this.baseUrl = baseUrl;
      this.privateKey = null;
      this.publicKey = null;
    }

    // Generate ephemeral RSA key pair
    async generateKeyPair() {
      const pair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
      );
      this.privateKey = pair.privateKey;
      this.publicKey = pair.publicKey;
    }

    // Export public key in Base64
    async exportPublicKey() {
      const raw = await crypto.subtle.exportKey("spki", this.publicKey);
      return btoa(String.fromCharCode(...new Uint8Array(raw)));
    }

    // Decrypt server response (Base64)
    async decryptResponse(cipherBase64) {
      const bytes = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
      const decrypted = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        this.privateKey,
        bytes
      );
      return JSON.parse(new TextDecoder().decode(decrypted));
    }

    // Send data + public key, get decrypted response
    async post(data) {
      await this.generateKeyPair();
      const pubKey = await this.exportPublicKey();

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, pub: pubKey })
      });
      const res = await response.json();
      const f = await this.decryptResponse(res.f);
      const i = await this.decryptResponse(res.i);
      // Clear keys
      this.privateKey = null;
      this.publicKey = null;

      return {formulas: f.formulas, i: i.ip};
    }
  }