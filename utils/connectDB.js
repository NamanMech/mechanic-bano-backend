import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const DB_NAME = 'mechanic_bano';
const CONNECTION_TIMEOUT = 10000; // 10 seconds

if (!uri) {
  throw new Error('Please define the MONGO_URI environment variable');
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null, lastConnected: null };
}

// Function to check if connection is stale (older than 5 minutes)
function isConnectionStale() {
  if (!cached.lastConnected) return true;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return cached.lastConnected < fiveMinutesAgo;
}

export async function connectDB() {
  // Return cached connection if available and not stale
  if (cached.conn && !isConnectionStale()) {
    try {
      // Verify connection is still alive
      await cached.conn.client.db().admin().ping();
      return cached.conn;
    } catch (error) {
      console.log('Database connection lost, reconnecting...');
      // Connection is dead, clear cache and reconnect
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      maxPoolSize: 10,
      minPoolSize: 1,
    }).then((client) => {
      console.log('Connected to MongoDB successfully');
      return {
        client,
        db: client.db(DB_NAME),
      };
    }).catch(error => {
      console.error('Failed to connect to MongoDB:', error);
      cached.promise = null; // Reset promise on failure
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    cached.lastConnected = Date.now();
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on failure
    throw error;
  }
}

// Optional: Add a function to close the connection
export async function closeDB() {
  if (cached.conn) {
    await cached.conn.client.close();
    cached.conn = null;
    cached.promise = null;
    cached.lastConnected = null;
    console.log('MongoDB connection closed');
  }
}
