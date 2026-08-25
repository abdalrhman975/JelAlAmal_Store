const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Student = require("../models/Student");

const router = express.Router();

// إنشاء طلب جديد + خصم النقاط فوراً
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { studentId, items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: "السلة فارغة" });
    }

    const totalPoints = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    let createdOrder;
    let updatedStudent;

    await session.withTransaction(async () => {
      const student = await Student.findById(studentId).session(session);
      if (!student) throw new Error("الطالب غير موجود");
      if (student.points < totalPoints) throw new Error("رصيد النقاط غير كافٍ");

      student.points -= totalPoints;
      await student.save({ session });
      updatedStudent = student;

      const orderItems = items.map((i) => ({
        product: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      const [order] = await Order.create(
        [{ student: studentId, items: orderItems, totalPoints, status: "pending" }],
        { session }
      );
      createdOrder = order;
    });

    res.status(201).json({ order: createdOrder, student: updatedStudent });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// جلب طلبات طالب معين (مسار جديد)
router.get("/student/:studentId", async (req, res) => {
  try {
    const orders = await Order.find({ student: req.params.studentId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// جلب كافة الطلبات مع معلومات الطالب
router.get("/", async (req, res) => {
  const orders = await Order.find().populate("student", "name points").sort({ createdAt: -1 });
  res.json(orders);
});

// جلب كميات المنتجات المطلوبة
router.get("/quantities", async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          totalQuantity: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تغيير حالة التسليم
router.patch("/:id/deliver", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: "delivered" },
    { new: true }
  );
  if (!order) return res.status(404).json({ message: "غير موجود" });
  res.json(order);
});

router.get("/student/:studentId", async (req, res) => {
  try {
    const orders = await Order.find({ student: req.params.studentId })
      .sort({ createdAt: -1 })
      .populate("student", "name points");
    
    // تنسيق البيانات للواجهة
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      items: order.items.map(item => ({
        productId: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: order.totalPoints,
      date: new Date(order.createdAt).toLocaleString("ar-EG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: order.status
    }));
    
    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;