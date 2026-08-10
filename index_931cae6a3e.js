const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://admin:martapura@92.113.124.178:27017";
const dbName = process.env.MONGODB_DB_NAME || "DatabaseVionyxNEW";

let client;
let db;
let isConnected = false;

/**
 * Connect to MongoDB
 * Auto-connect on import, sama seperti backend
 */
async function connectMongoDB() {
  if (isConnected) {
    console.log('[MongoDB] Already connected');
    return db;
  }

  try {
    client = new MongoClient(uri, {
      //useNewUrlParser: true,
      //useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(dbName);
    isConnected = true;

    console.log('✅ [SC Bot] Connected to MongoDB');
    console.log(`✅ [SC Bot] Database: ${dbName}`);

    // Optional: Initialize indexes
    await initializeIndexes();

    return db;
  } catch (error) {
    console.error('❌ [SC Bot] Error connecting to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Initialize indexes (optional)
 */
async function initializeIndexes() {
  try {
    const usersCollection = db.collection('users');
    const userIndexCollection = db.collection('user_index');

    // Create indexes (sparse = only index documents that have the field)
    await usersCollection.createIndex({ username: 1 }, { unique: true, sparse: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await userIndexCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await userIndexCollection.createIndex({ username: 1 }, { unique: true, sparse: true });

    console.log('✅ [SC Bot] Database indexes initialized');
  } catch (error) {
    // Ignore index errors (might already exist)
    console.warn('⚠️ [SC Bot] Index creation warning:', error.message);
  }
}

/**
 * Get database instance
 * Auto-connect jika belum connect
 */
async function getDatabase() {
  if (!isConnected) {
    await connectMongoDB();
  }
  return db;
}

/**
 * Get MongoDB client
 */
function getClient() {
  return client;
}

/**
 * Close connection (untuk graceful shutdown)
 */
async function closeConnection() {
  if (client && isConnected) {
    await client.close();
    isConnected = false;
    console.log('✅ [SC Bot] MongoDB connection closed');
  }
}

// Auto-connect on import
connectMongoDB().catch(err => {
  console.error('❌ [SC Bot] Failed to connect to MongoDB on startup:', err.message);
  // Don't exit process - let the app continue, connection will retry on demand
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

// Export
module.exports = {
  getDatabase,
  getClient,
  connectMongoDB,
  closeConnection,
  get db() {
    return db;
  },
  get isConnected() {
    return isConnected;
  },
  DB_NAME: dbName
};
