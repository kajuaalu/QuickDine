import mongoose from 'mongoose';

export async function connectToMongoDB() {
  try {
    await mongoose.connect("mongodb://kazumadesu02_db_user:91cMMxNKkH7gLpV5@ac-9mtslse-shard-00-00.eo45fm6.mongodb.net:27017,ac-9mtslse-shard-00-01.eo45fm6.mongodb.net:27017,ac-9mtslse-shard-00-02.eo45fm6.mongodb.net:27017/?ssl=true&replicaSet=atlas-3dl0n1-shard-0&authSource=admin&appName=Cluster0&compressors=zlib");
    console.log("You successfully connected to MongoDB!");
    return mongoose;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await mongoose.connection.close();
}