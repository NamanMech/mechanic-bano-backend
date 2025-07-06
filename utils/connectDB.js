// utils/connectDB.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

let cached = global._mongoClientPromise;

if (!cached) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  cached = client.connect();
  global._mongoClientPromise = cached;
}

export async function connectDB() {
  return await cached;
}
