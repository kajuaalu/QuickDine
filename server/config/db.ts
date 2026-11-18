import mongoose from 'mongoose';

/**
 * Opens Mongoose's default connection to the configured MongoDB cluster.
 * Connection errors are caught and do not reject the returned promise.
 * @returns The Mongoose instance on success, or undefined if connecting fails.
 */
export async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is required");
    }
    await mongoose.connect(uri);
    console.log("You successfully connected to MongoDB!");
    return mongoose;
  } catch (err) {
    console.dir(err);
    throw err;
  }
}

/**
 * Closes Mongoose's default connection during application shutdown.
 * @returns A promise that resolves without a value when the connection is closed.
 * @throws Propagates errors from closing the connection as promise rejections.
 */
export async function disconnectFromMongoDB() {
  await mongoose.connection.close();
}
