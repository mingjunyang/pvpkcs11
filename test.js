/// <reference types="mocha" />

// @ts-check

const pkcs11 = require("pkcs11js");
const helper = require("pvtsutils");
const p11_crypto = require("node-webcrypto-p11");
const ossl_crypto = require("node-webcrypto-ossl");
const assert = require("assert");

const config = require("./test/config");


let p11 = new p11_crypto.WebCrypto({
    library: config.lib,
    slot: 0,
});
let ossl = new ossl_crypto();

// const alg = {
//     name: "RSASSA-PKCS1-v1_5",
//     hash: "SHA-256",
//     publicExponent: new Uint8Array([1, 0, 1]),
//     modulusLength: 1024,
// };
// const alg = {
//     name: "ECDSA",
//     namedCurve: "P-384",
//     hash: "SHA-256",
// };
const alg = {
    name: "AES-CBC",
    length: 256
};

const data = new Buffer([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6]);

function hex2b64url(hex) {
    return helper.Convert.ToBase64Url(helper.Convert.FromHex(hex));
}

let promise = Promise.resolve()

// Iterations
const iterations = 1

for (var i = 0; i < iterations; i++) {
    let iter = i;
    promise = promise
        .then(() => {
            let msg = `Iteration #${iter}`;
            console.log(msg);
            return p11.subtle.generateKey(alg, true, ["encrypt", "decrypt"])
                .then((key) => {
                    return p11.keyStorage.setItem(key);
                })
                .then((index) => {
                    console.log(index);
                    return p11.keyStorage.getItem(index);
                })
                .then((key) => {
                    console.log(key)
                })

        })

}

promise
    // @ts-ignore
    .catch((err) => {
        console.error(err);
    });


