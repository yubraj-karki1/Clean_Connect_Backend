process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clean-connect-test";
