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
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    try {
      // Simple check to verify connection is still alive
      await cachedDb.command({ ping: 1 });
      return cachedDb; // Return just the database instance
    } catch (error) {
      console.log('Database connection lost, reconnecting...');
      // Connection is dead, clear cache and reconnect
      cachedClient = null;
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
    cachedClient = client;
    cachedDb = db;
    
    return db; // Return just the database instance
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Optional: Add a function to close the connection
export async function closeDB() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('MongoDB connection closed');
  }
}
