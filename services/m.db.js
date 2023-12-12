const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB;
let pool;

async function connectToMongoDB() {
  try {
    pool = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

connectToMongoDB();

module.exports = pool;
