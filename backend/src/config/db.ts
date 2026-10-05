import mongoose from "mongoose";

/**
 * Establish a connection to MongoDB using MONGODB_URI from .env.
 * Fails loudly if the URI is missing or the connection cannot be made.
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set in environment variables. " +
        "Please copy .env.example to .env and configure it."
    );
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err);
    process.exit(1); // hard exit — app cannot run without DB
  }
}
