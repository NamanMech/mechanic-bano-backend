// utils/connectDB.js
import { MongoClient } from 'mongodb';

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const client = new MongoClient(process.env.MONGO_URI);
    cached.promise = client.connect().then((client) => {
      return client;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
