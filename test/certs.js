const assert = require("assert");
const { Crypto } = require("node-webcrypto-p11");
const x509 = require("@peculiar/x509");
const config = require("./config");
const { Convert } = require("pvtsutils");

context.only("Certificates", () => {

  context("Certificate request", () => {
    const crypto = new Crypto({
      library: config.lib,
      slot: 0,
    });

    it("Create", async () => {
      const alg = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
        publicExponent: new Uint8Array([1, 0, 1]),
        modulusLength: 2048,
      };

      const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
      const pkcs10 = await x509.Pkcs10CertificateRequestGenerator.create({
        keys,
        signingAlgorithm: alg,
        name: "CN=PVPKCS11 test, O=PeculiarVentures",
      }, crypto);

      await crypto.keyStorage.setItem(keys.privateKey);
      const req = await crypto.certStorage.importCert("raw", pkcs10.rawData, keys.publicKey.algorithm, keys.publicKey.usages);
      const reqIndex = await crypto.certStorage.setItem(req);

      const reqFromStore = await crypto.certStorage.getItem(reqIndex);
      assert(reqFromStore)
    });

  });

  it("Close", () => {
    const crypto = new Crypto({
      library: config.lib,
      slot: 0,
    });

    assert.strictEqual(crypto.isLoginRequired, false);
    assert.strictEqual(crypto.isLoggedIn, true);

    crypto.close();
  });

  context("Certificate", () => {
    const crypto = new Crypto({
      library: config.lib,
      slot: 0,
    });

    async function createCertificate() {
      const alg = {
        name: "ECDSA",
        hash: "SHA-256",
        namedCurve: "P-256",
      };

      const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
      const cert = await x509.X509CertificateGenerator.createSelfSigned({
        keys,
        serialNumber: Convert.ToHex(crypto.getRandomValues(new Uint8Array(20))),
        notBefore: new Date(),
        notAfter: new Date(Date.now() + (24 * 60 * 60 * 1e3)),
        signingAlgorithm: alg,
        name: "CN=PVPKCS11 test, O=PeculiarVentures",
        extensions: [
          new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature),
        ]
      }, crypto);

      await crypto.keyStorage.setItem(keys.privateKey);
      console.log(cert.toString("pem"));
      const cCert = await crypto.certStorage.importCert("raw", cert.rawData, keys.publicKey.algorithm, keys.publicKey.usages);
      const certIndex = await crypto.certStorage.setItem(cCert);

      return {
        index: certIndex,
        cert: cCert,
        keys,
      }
    }

    it("import/set/get", async () => {
      const item = await createCertificate();

      const certFromStore = await crypto.certStorage.getItem(item.index);
      assert(certFromStore)
    });

    it("delete", async () => {
      const item = await createCertificate();

      crypto.certStorage.removeItem(item.index);
    });

  });

  it.only("Items", async () => {
    const crypto = new Crypto({
      library: config.lib,
      slot: 0,
    });

    const keys = await crypto.keyStorage.keys();
    for (const i of keys) {
      if (!i.endsWith("a3fa1ef5b7700f2616402fd890ddf5d595868655")) {
        continue;
      }

      const key = await crypto.keyStorage.getItem(i);
      console.log(key);
    }

    const certs = await crypto.certStorage.keys();
    for (const i of certs) {
      const cert = await crypto.certStorage.getItem(i);

      if (keys.find(o => {
        const [type, , id] = o.split("-");
        return type === "private" && id === i.split("-")[2]
      })) {
        console.log(i);
        console.log(cert.subjectName);
      }
    }
  });

});
