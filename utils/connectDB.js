// utils/connectDB.js

const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = { connectDB };
