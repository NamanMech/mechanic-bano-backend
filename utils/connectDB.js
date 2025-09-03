import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const DB_NAME = 'mechanic_bano';
const CONNECTION_TIMEOUT = 10000; // 10 seconds

if (!uri) {
  throw new Error('Please define the MONGO_URI environment variable');
}

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  if (cachedDb && cachedClient) {
    try {
      await cachedClient.db(DB_NAME).command({ ping: 1 });
      return cachedDb;
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
    maxPoolSize: 10,
    minPoolSize: 1,
  });

  await client.connect();
  const db = client.db(DB_NAME);
  await db.command({ ping: 1 });

  cachedClient = client;
  cachedDb = db;

  console.log('Connected to MongoDB successfully');
  return db;
}
