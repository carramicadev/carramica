const functions = require("firebase-functions");
const { QISCUS_SECRETS } = require("./src/services/qiscusWA");

exports.jakartaFn = functions.region("asia-southeast2");

// Same region, plus access to the Qiscus secret. A new builder on every call:
// runWith() mutates the builder it is called on, so sharing one would leak the
// options into every function defined after it.
exports.jakartaQiscusFn = (runtimeOptions = {}) =>
  functions
    .region("asia-southeast2")
    .runWith({ ...runtimeOptions, secrets: QISCUS_SECRETS });
