import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(dbName: string = "chatbot") {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getCollection(
  collectionName: string,
  dbName: string = "chatbot"
) {
  const db = await getDatabase(dbName);
  return db.collection(collectionName);
}

export interface User {
  username: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  createdAt: Date;
}