import mongoose, { Document, Schema } from "mongoose";

/**
 * Mongoose User model for the 'users' collection.
 *
 * Database document structure:
 *   _id          - MongoDB ObjectId (auto)
 *   username     - unique username
 *   email        - unique email (lowercased)
 *   passwordHash - scrypt output; select:false so it's excluded by default
 *   salt         - per-user random salt; select:false for same reason
 *   createdAt    - timestamp
 *
 * IMPORTANT — select: false on passwordHash and salt:
 *   Normal queries (.find(), .findOne()) will NOT return these fields.
 *   To fetch them explicitly during login, use:
 *       User.findOne({ email }).select("+passwordHash +salt")
 *   This prevents accidental exposure of security-sensitive fields.
 *
 * ❌ Never add a "password" field.
 * ❌ Never add a "pepper" field.
 */
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string; // scrypt hash of (password + salt + pepper)
  salt: string;         // cryptographically secure random salt, unique per user
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must not exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // always stored in lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // excluded from all queries by default
    },
    salt: {
      type: String,
      required: true,
      select: false, // excluded from all queries by default
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disable __v field
    versionKey: false,
  }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
