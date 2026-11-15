import mongoose from "mongoose";

export async function connectDatabase() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not set. Add it to server/.env.");
  }

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected");
}
