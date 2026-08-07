import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

let connectionPromise: Promise<void> | null = null;
let listenersRegistered = false;
let reconnectTimer: NodeJS.Timeout | null = null;

const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
  minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 1),
  retryWrites: true
};

export const isDatabaseReady = (): boolean => mongoose.connection.readyState === 1;

const scheduleReconnect = (): void => {
  if (reconnectTimer || isDatabaseReady()) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connectDB();
    } catch {
      scheduleReconnect();
    }
  }, 5000);
  reconnectTimer.unref?.();
};

const registerConnectionListeners = (): void => {
  if (listenersRegistered) return;
  listenersRegistered = true;
  mongoose.connection.on('connected', () => console.log('✅ MongoDB connection ready'));
  mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected successfully'));
  mongoose.connection.on('disconnected', () => {
    console.error('❌ MongoDB disconnected; retrying in 5 seconds');
    scheduleReconnect();
  });
  mongoose.connection.on('error', error => {
    console.error('❌ MongoDB connection error:', error instanceof Error ? error.message : error);
  });
}

export const connectDB = async (): Promise<void> => {
  if (isDatabaseReady()) return;
  if (connectionPromise) return connectionPromise;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not defined');

  registerConnectionListeners();
  connectionPromise = (async () => {
    try {
      console.log('🔗 Connecting to MongoDB...');
      await mongoose.connect(uri, connectionOptions);
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
      scheduleReconnect();
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();
  return connectionPromise;
};

export const disconnectDB = async (): Promise<void> => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected successfully');
};

export default { connectDB, disconnectDB, isDatabaseReady };
