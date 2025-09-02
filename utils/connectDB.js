import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const DB_NAME = 'mechanic_bano';
const CONNECTION_TIMEOUT = 10000; // 10 seconds

if (!uri) {
  throw new Error('Please define the MONGO_URI environment variable');
}

// Simple connection caching for serverless environments
let cachedDb = null;

export async function connectDB() {
  // Return cached connection if available
  if (cachedDb) {
    try {
      // Verify connection is still alive
      await cachedDb.command({ ping: 1 });
      return cachedDb;
    } catch (error) {
      console.log('Database connection lost, reconnecting...');
      cachedDb = null;
    }
  }

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    await client.connect();
    const db = client.db(DB_NAME);
    
    // Test the connection
    await db.command({ ping: 1 });
    
    console.log('Connected to MongoDB successfully');
    
    // Cache the connection
    cachedDb = db;
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
