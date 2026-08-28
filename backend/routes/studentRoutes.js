const express = require("express");
const router = express.Router();

const { Student, normalizeName } = require("../models/Student");
const Order = require("../models/Order");

const generate5DigitPassword = () => Math.floor(10000 + Math.random() * 90000).toString();

// ---------------------------------------------------------
// 1. تسجيل الدخول
// ---------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    const normalizedName = normalizeName(name);

    const student = await Student.findOne({ name: normalizedName, password });
    if (!student) return res.status(400).json({ message: "اسم الطالب أو كلمة المرور غير صحيحة" });

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 2. جلب كافة الطلاب
// ---------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 3. إضافة طالب يدوياً
// ---------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      password: req.body.password || generate5DigitPassword(),
    };
    const newStudent = new Student(studentData);
    await newStudent.save();
    res.json(newStudent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 4. استيراد طلاب من Excel
// ---------------------------------------------------------
router.post("/bulk", async (req, res) => {
  try {
    const students = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "الملف فارغ أو غير صالح" });
    }

    const processedStudents = students.map((s) => ({
      ...s,
      password: s.password && String(s.password).trim() !== "" ? String(s.password) : generate5DigitPassword(),
    }));

    const createdStudents = await Student.insertMany(processedStudents);
    res.json({ message: "تم استيراد الطلاب بنجاح", count: createdStudents.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 🛒 مسارات السلة (مُحدثة للتحقق من النقاط لمنع الرصيد بالسالب)
// ---------------------------------------------------------

// أ) إضافة منتج إلى سلة الطالب مع فحص النقاط
router.post("/:id/cart", async (req, res) => {
  try {
    const { productId, name, price, quantity = 1 } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) return res.status(404).json({ message: "الطالب غير موجود" });

    // حساب المجموع الحالي في السلة
    const currentCartTotal = student.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const addedCost = Number(price) * Number(quantity);

    // 🛑 التحقق من عدم تجاوز النقاط المتاحة
    if (currentCartTotal + addedCost > student.points) {
      return res.status(400).json({
        message: `لا يمكنك إضافة هذا المنتج! رصيدك (${student.points} نقطة) لا يكفي لإجمالي السلة (${currentCartTotal + addedCost} نقطة).`,
      });
    }

    const existingIndex = student.cart.findIndex(
      (item) => item.product?.toString() === productId || item.name === name
    );

    if (existingIndex > -1) {
      student.cart[existingIndex].quantity += Number(quantity);
    } else {
      student.cart.push({
        product: productId,
        name,
        price: Number(price),
        quantity: Number(quantity),
      });
    }

    await student.save();
    res.json({ message: "تمت إضافة المنتج إلى السلة بنجاح", cart: student.cart, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ب) تعديل كمية منتج في السلة مع فحص النقاط
router.put("/:id/cart/:itemId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "الطالب غير موجود" });

    const itemIndex = student.cart.findIndex(
      (item) => item._id.toString() === req.params.itemId || item.product?.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "المنتج غير موجود بالسلة" });
    }

    // نسخ محتوى السلة واحتساب التكلفة الجديدة بالكمية المطلوبة
    const updatedCart = [...student.cart];
    updatedCart[itemIndex].quantity = Number(quantity);

    const newTotal = updatedCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 🛑 منع رفع الكمية إن تجاوزت النقاط
    if (newTotal > student.points) {
      return res.status(400).json({
        message: `لا يمكن زيادة الكمية! المجموع الجديد (${newTotal} نقطة) يتجاوز رصيدك (${student.points} نقطة).`,
      });
    }

    student.cart = updatedCart;
    await student.save();

    res.json({ message: "تم تحديث الكمية بنجاح", cart: student.cart, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ج) حذف منتج محدد من سلة الطالب
router.delete("/:id/cart/:itemId", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "الطالب غير موجود" });

    student.cart = student.cart.filter(
      (item) => item._id.toString() !== req.params.itemId && item.product?.toString() !== req.params.itemId
    );
    await student.save();

    res.json({ message: "تم حذف المنتج من السلة", cart: student.cart, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// د) تفريغ السلة بالكامل
router.delete("/:id/cart", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "الطالب غير موجود" });

    student.cart = [];
    await student.save();

    res.json({ message: "تم إفراغ السلة بنجاح", cart: [], student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 🚀 تأكيد الطلب (Checkout)
// ---------------------------------------------------------
router.post("/:id/checkout", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "الطالب غير موجود" });

    if (!student.cart || student.cart.length === 0) {
      return res.status(400).json({ message: "سلة المشتريات فارغة!" });
    }

    const calculatedTotal = student.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 🛑 فحص حاسم للرصيد
    if (student.points < calculatedTotal) {
      return res.status(400).json({
        message: `رصيد النقاط لا يكفي! المجموع المطلوب: ${calculatedTotal} نقطة، ورصيدك الحالي: ${student.points} نقطة`,
      });
    }

    const newOrder = new Order({
      student: student._id,
      items: student.cart.map((item) => ({
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPoints: calculatedTotal,
      totalPrice: calculatedTotal,
      status: "pending",
    });

    await newOrder.save();

    student.points -= calculatedTotal;
    student.cart = [];
    await student.save();

    res.json({
      message: "تم تأكيد الطلب بنجاح! 🎉",
      order: newOrder,
      student,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 5. تعديل بيانات طالب
// ---------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    if (req.body.name) {
      req.body.name = normalizeName(req.body.name);
    }
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ---------------------------------------------------------
// 7. حذف جميع الطلاب وحذف كل طلباتهم
// ---------------------------------------------------------
router.delete("/", async (req, res) => {
  try {
    // 1. حذف جميع الطلاب من قاعدة البيانات
    await Student.deleteMany({});

    // 2. حذف كافة الطلبات المرتبطة بالطلاب
    await Order.deleteMany({});

    res.json({ message: "تم حذف جميع الطلاب وكافة الطلبات بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------
// 6. حذف طالب وحذف طلباته
// ---------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    await Student.findByIdAndDelete(studentId);
    await Order.deleteMany({ student: studentId });
    res.json({ message: "تم حذف الطالب وطلباته بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;