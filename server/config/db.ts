import mongoose from 'mongoose';

/**
 * Opens Mongoose's default connection to the configured MongoDB cluster.
 * Connection errors are caught and do not reject the returned promise.
 * @returns The Mongoose instance on success, or undefined if connecting fails.
 */
export async function connectToMongoDB() {
  try {
    await mongoose.connect("mongodb://kazumadesu02_db_user:91cMMxNKkH7gLpV5@ac-9mtslse-shard-00-00.eo45fm6.mongodb.net:27017,ac-9mtslse-shard-00-01.eo45fm6.mongodb.net:27017,ac-9mtslse-shard-00-02.eo45fm6.mongodb.net:27017/?ssl=true&replicaSet=atlas-3dl0n1-shard-0&authSource=admin&appName=Cluster0&compressors=zlib");
    console.log("You successfully connected to MongoDB!");
    return mongoose;
  } catch (err) {
    console.dir(err);
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