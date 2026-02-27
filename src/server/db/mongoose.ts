import mongoose from "mongoose";
import { env } from "../config";

export async function dbConnect() {
  if (!global.__mongooseConn) {
    global.__mongooseConn = { conn: null, promise: null };
  }

  if (global.__mongooseConn.conn) return global.__mongooseConn.conn;

  if (!global.__mongooseConn.promise) {
    global.__mongooseConn.promise = mongoose.connect(env.MONGODB_URI);
  }

  global.__mongooseConn.conn = await global.__mongooseConn.promise;
  return global.__mongooseConn.conn;
}
