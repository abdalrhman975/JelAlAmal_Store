import { useState, useEffect } from "react";
import { api } from "../api.js";
import * as XLSX from "xlsx";

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // حقول نموذج المنتج
  const [name, setName] = useState("");
  const [category, setCategory] = useState("لعبة");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // حالة الإشعار الاحترافي (Toast)
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' | 'error' }

  useEffect(() => {
    loadProducts();
  }, []);

  // إخفاء الإشعار تلقائياً بعد 3.5 ثانية
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  async function loadProducts() {
    try {
      const data = await api.getProducts("All");
      setProducts(data);
    } catch (error) {
      console.error("خطأ في تحميل المنتجات:", error);
    }
  }

  function startEdit(product) {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price.toString());
    setImagePreview(getImageUrl(product.imageUrl));
    setImage(null);
  }

  function getImageUrl(imageUrl) {
    if (!imageUrl) return null;
    return imageUrl; 
  }

  function resetForm() {
    setEditingProduct(null);
    setName("");
    setCategory("لعبة");
    setPrice("");
    setImage(null);
    setImagePreview(null);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("price", price);
      if (image) formData.append("image", image);

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
        showToast("تم حفظ تعديل المنتج بنجاح! ✏️", "success");
      } else {
        await api.createProduct(formData);
        showToast("تمت إضافة المنتج بنجاح! 🎉", "success");
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      console.error("خطأ في حفظ المنتج:", error);
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await api.deleteProduct(id);
        showToast("تم حذف المنتج بنجاح", "success");
        await loadProducts();
      } catch (error) {
        console.error("خطأ في حذف المنتج:", error);
        showToast(error.message, "error");
      }
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          showToast("الملف فارغ أو لا يحتوي على بيانات صالحة", "warning");
          return;
        }

        const formattedProducts = data.map((item, index) => {
          const cleanItem = {};
          Object.keys(item).forEach((key) => {
            cleanItem[key.trim()] = item[key];
          });

          const rawName =
            cleanItem["اسم اللعبة"] ||
            cleanItem["الاسم"] ||
            cleanItem["اسم المنتج"] ||
            cleanItem["name"] ||
            cleanItem["Name"];

          const name = rawName ? String(rawName).trim() : `منتج ${index + 1}`;

          const category = String(
            cleanItem["التصنيف"] || cleanItem["النوع"] || cleanItem["category"] || "أخرى"
          ).trim();

          const rawPrice =
            cleanItem["السعر"] ??
            cleanItem["النقاط"] ??
            cleanItem["points"] ??
            cleanItem["price"] ??
            0;

          return {
            name,
            category,
            price: Number(rawPrice) || 0,
          };
        });

        await api.bulkCreateProducts(formattedProducts);
        showToast(`تمت إضافة ${formattedProducts.length} منتجات بنجاح! 🎉`, "success");
        await loadProducts();
      } catch (err) {
        showToast("حدث خطأ أثناء قراءة الملف: " + err.message, "error");
      } finally {
        setLoading(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
  }

  function handleExportToExcel() {
    if (!products || products.length === 0) {
      showToast("لا توجد منتجات لتصديرها", "warning");
      return;
    }

    const formattedData = products.map((p) => ({
      "اسم المنتج": p.name,
      "التصنيف": p.category,
      "السعر (نقاط)": p.price,
      "رابط الصورة": p.imageUrl || "", // تم إضافة رابط الصورة هنا
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات");

    XLSX.writeFile(workbook, "products_list.xlsx");
    showToast("تم تصدير ملف Excel بنجاح! 📥", "success");
  }

  return (
    <div style={{ position: "relative" }}>
      {/* 🔔 الإشعار الاحترافي العائم (Toast Notification) */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 22px",
            borderRadius: "14px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            background: toast.type === "success" ? "#059669" : toast.type === "warning" ? "#d97706" : "#dc2626",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "15px",
            animation: "toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            minWidth: "300px",
            maxWidth: "90%",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>
              {toast.type === "success" ? "✅" : toast.type === "warning" ? "⚠️" : "❌"}
            </span>
            <span>{toast.message}</span>
          </div>

          <button
            onClick={() => setToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: "1",
              opacity: 0.8
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* انيميشن ظهور الإشعار */}
      <style>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>

      {/* نموذج إضافة وتعديل المنتجات */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          marginBottom: "24px"
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "18px", fontWeight: "700" }}>
          {editingProduct ? "✏️ تعديل بيانات المنتج" : "➕ إضافة منتج جديد"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          <input
            placeholder="اسم المنتج"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: "10px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontSize: "14px",
              outline: "none",
              color: "#1e293b"
            }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontSize: "14px",
              outline: "none",
              background: "#ffffff",
              color: "#1e293b"
            }}
          >
            <option value="لعبة">🎮 لعبة</option>
            <option value="كتاب">📚 كتاب</option>
            <option value="قرطاسية">✏️ قرطاسية</option>
            <option value="إلكترونيات">🚨 إلكترونيات</option>
            <option value="أخرى">📌 أخرى</option>
          </select>

          <input
            type="number"
            placeholder="السعر (نقاط)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{
              padding: "10px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontSize: "14px",
              outline: "none",
              color: "#1e293b"
            }}
          />

          {/* رافع الصورة */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="imageInput"
              style={{ display: "none" }}
            />
            <label
              htmlFor="imageInput"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #cbd5e1",
                borderRadius: "10px",
                cursor: "pointer",
                background: "#f8fafc",
                height: "42px",
                padding: "0 10px",
                fontSize: "13px",
                color: "#64748b",
                overflow: "hidden"
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="معاينة"
                  style={{ height: "32px", width: "32px", objectFit: "cover", borderRadius: "6px" }}
                />
              ) : (
                <span>📷 اختر صورة</span>
              )}
            </label>
          </div>
        </div>

        {/* أزرار الحفظ والإلغاء */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          {editingProduct && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #cbd5e1",
                padding: "10px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              ❌ إلغاء
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2DAFBB",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 2px 6px rgba(45, 175, 187, 0.3)",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "⏳ جارٍ الحفظ..." : editingProduct ? "💾 حفظ التعديل" : "➕ إضافة المنتج"}
          </button>
        </div>
      </form>

      {/* جدول عرض المنتجات */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>
            📦 قائمة المنتجات ({products.length})
          </h3>

          <div style={{ display: "flex", gap: "10px" }}>
            {/* زر التصدير إلى إكسل */}
            <button
              onClick={handleExportToExcel}
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
                padding: "8px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📥 تصدير إلى Excel
            </button>

            {/* زر الاستيراد من إكسل */}
            <label
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                padding: "8px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? "⏳ جاري الاستيراد..." : "📤 استيراد من Excel"}
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "#f8fafc", fontSize: "13px", color: "#475569" }}>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>اسم المنتج</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>التصنيف</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>السعر</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: "600", color: "#0f172a" }}>
                    {p.name}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", color: "#475569" }}>
                    <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "6px" }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: "700", color: "#2DAFBB" }}>
                    {p.price} نقطة
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => startEdit(p)}
                        title="تعديل"
                        style={{
                          background: "#f1f5f9",
                          color: "#2DAFBB",
                          border: "1px solid #cbd5e1",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600"
                        }}
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        style={{
                          background: "#fef2f2",
                          color: "#ef4444",
                          border: "1px solid #fecaca",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600"
                        }}
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}