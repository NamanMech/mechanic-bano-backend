// utils/connectDB.js
import { MongoClient } from 'mongodb';

let cachedClient = null;

export async function connectDB() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  cachedClient = client;
  return client;
}
