// File: couchbaseConfig.js

require('dotenv').config();
const couchbase = require('couchbase');

const cluster = new couchbase.Cluster(process.env.COUCHBASE_URL, {
  username: process.env.COUCHBASE_USERNAME,
  password: process.env.COUCHBASE_PASSWORD,
});

const bucket = cluster.bucket(process.env.travel-sample); // INPUT_REQUIRED {Please ensure this environment variable is correctly set to your Couchbase bucket name.}
const collection = bucket.defaultCollection();

module.exports = { cluster, collection };