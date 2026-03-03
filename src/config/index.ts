// Frontend URL for password reset
export const CLIENT_URL: string = process.env.CLIENT_URL || 'http://localhost:3000';
import dotenv from 'dotenv';
dotenv.config();

// Server Port
export const PORT: number =
  process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// MongoDB URI (must come from .env)
export const MONGO_URI: string = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined in .env file');
}

// JWT Secret
export const JWT_SECRET: string =
  process.env.JWT_SECRET || 'defaultsecret';
