const mongoose = require("mongoose");

const normalizeName = (val) => {
  if (typeof val !== "string") return val;
  return val
    .trim() 
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");
};

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      set: normalizeName,
    },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    points: { type: Number, default: 0 },
    
    // 🛒 خانة المشتريات المؤقتة (السلة)
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  Student: mongoose.model("Student", studentSchema),
  normalizeName,
};