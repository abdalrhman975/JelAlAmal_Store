const BASE_URL = "https://manaralmoslhen-store.onrender.com";

export const api = {
  // --- تسجيل الدخول ---
  studentLogin: async (name, password) => {
    const res = await fetch(`${BASE_URL}/api/students/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "اسم الطالب أو كلمة المرور غير صحيحة");
    return data;
  },

  adminLogin: async (password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "كلمة المرور غير صحيحة");
    return data;
  },

  // --- إدارة الطلاب ---
  getStudents: async () => {
    const res = await fetch(`${BASE_URL}/api/students`);
    return res.json();
  },

  addStudent: async (studentData) => {
    const res = await fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشلت إضافة الطالب");
    return data;
  },

  createStudent: async (studentData) => {
    return api.addStudent(studentData);
  },

  bulkCreateStudents: async (studentsArray) => {
    const res = await fetch(`${BASE_URL}/api/students/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentsArray),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل استيراد الطلاب");
    return data;
  },

  updateStudent: async (id, studentData) => {
    const res = await fetch(`${BASE_URL}/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });
    return res.json();
  },

  deleteStudent: async (id) => {
    const res = await fetch(`${BASE_URL}/api/students/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل حذف الطالب");
    return data;
  },

  deleteAllStudents: async () => {
    const res = await fetch(`${BASE_URL}/api/students`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل حذف جميع الطلاب");
    return data;
  },

  // --- إدارة المنتجات ---
  getProducts: async (category = "All") => {
    try {
      const url = category && category !== "All"
        ? `${BASE_URL}/api/products?category=${category}`
        : `${BASE_URL}/api/products`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  bulkCreateProducts: async (ProductsArray) => {
    const res = await fetch(`${BASE_URL}/api/products/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ProductsArray),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل استيراد المنتجات");
    return data;
  },

  createProduct: async (formData) => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشلت إضافة المنتج");
    return data;
  },

  updateProduct: async (id, formData) => {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: "PUT",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل تعديل المنتج");
    return data;
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل حذف المنتج");
    return data;
  },

  // --- إدارة سلة التسوق ---
  addToCart: async (studentId, item) => {
    const res = await fetch(`${BASE_URL}/api/students/${studentId}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشلت إضافة المنتج للسلة");
    return data;
  },

  updateCartQuantity: async (studentId, productId, quantity) => {
    const res = await fetch(`${BASE_URL}/api/students/${studentId}/cart/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل تعديل الكمية في السلة");
    return data;
  },

  removeFromCart: async (studentId, productId) => {
    const res = await fetch(`${BASE_URL}/api/students/${studentId}/cart/${productId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشلت إزالة المنتج من السلة");
    return data;
  },

  clearCart: async (studentId) => {
    const res = await fetch(`${BASE_URL}/api/students/${studentId}/cart`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل تفريغ السلة");
    return data;
  },

  // --- إدارة الطلبات والتسوق (مُعدّلة) ---
  submitOrder: async (studentId, items) => {
    const res = await fetch(`${BASE_URL}/api/students/${studentId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشلت عملية إرسال الطلب");
    return data;
  },

  getOrderQuantities: async () => {
    const res = await fetch(`${BASE_URL}/api/orders/quantities`);
    return res.json();
  },

  getStudentSelections: async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    return res.json();
  },

  updateOrderStatus: async (orderId) => {
    const res = await fetch(`${BASE_URL}/api/orders/${orderId}/deliver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },

  async getStudentOrders(studentId) {
    try {
      const response = await fetch(`${BASE_URL}/api/orders/student/${studentId}`);
      if (!response.ok) throw new Error("فشل في جلب الطلبات");
      return await response.json();
    } catch (err) {
      console.error("خطأ في جلب طلبات الطالب:", err);
      return [];
    }
  },

  getQuantities: async () => {
    const res = await fetch(`${BASE_URL}/api/orders/quantities`);
    return res.json();
  },

  getAllOrders: async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    return res.json();
  },

  markDelivered: async (orderId) => {
    const res = await fetch(`${BASE_URL}/api/orders/${orderId}/deliver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  }
};