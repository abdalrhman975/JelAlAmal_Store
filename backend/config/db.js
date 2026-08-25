const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb+srv://abdalrhmanobeid19_db_user:QAye5rrMBgctFqRL@jelalamalstore.vexwvaf.mongodb.net/?appName=JelAlAmalStore";
  await mongoose.connect(uri);
  console.log("MongoDB connected:", uri);
}

module.exports = connectDB;

