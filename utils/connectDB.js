// utils/connectDB.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('Please define the MONGO_URI environment variable');
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri).then((client) => {
      return {
        client,
        db: client.db('mechanic_bano'),
      };
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
