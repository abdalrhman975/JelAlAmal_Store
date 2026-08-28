import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const CATEGORIES = ["All", "لعبة", "كتاب", "قرطاسية", "إلكترونيات", "أخرى"];

export default function Market({ student, setStudent, onLogout, cart = [], addToCart }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [quantities, setQuantities] = useState({});
  const [loadingId, setLoadingId] = useState(null); // لمعرفة المنتج القيد والإضافة

  // حالة الإشعار الاحترافي (Toast)
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' }

  useEffect(() => {
    api.getProducts(category).then(setProducts);
  }, [category]);

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

  // اعتماد السلة من بيانات الطالب في السيرفر أولاً ثم الـ Prop
  const currentCart = student?.cart || cart || [];
  const cartCount = currentCart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotalPoints = currentCart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const remainingPoints = (student?.points || 0) - cartTotalPoints;

  const qty = (id) => quantities[id] ?? 1;
  const setQty = (id, val) => setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));

  // 🛒 إضافة المنتج إلى سلة الطالب في قاعدة البيانات
  async function handleAddToCart(product, quantity) {
    const itemCost = product.price * quantity;

    // 1. حالة عدم كفاية الرصيد
    if (remainingPoints < itemCost) {
      showToast(
        `عذراً، رصيدك المتاح (${remainingPoints} نقطة) لا يكفي لإضافة هذا المنتج.`,
        "warning"
      );
      return;
    }

    try {
      setLoadingId(product._id);

      // استدعاء API Backend لإضافة المنتج لسلة الطالب
      const res = await api.addToCart(student._id, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
      });

      // تحديث حالة الطالب ببيانات السلة الجديدة الجاية من السيرفر
      if (res.student) {
        setStudent(res.student);
        localStorage.setItem("mosque_student", JSON.stringify(res.student));
      } else if (addToCart) {
        addToCart(product, quantity);
      }

      showToast(`تمت إضافة "${product.name}" (${quantity}) إلى السلة بنجاح! 🛒`, "success");
    } catch (err) {
      showToast(err.message || "حدث خطأ أثناء إضافة المنتج إلى السلة", "warning");
    } finally {
      setLoadingId(null);
    }
  }

  function getImageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== "string") return null;
    const cleanUrl = imageUrl.trim();
    return cleanUrl || null;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px", position: "relative" }}>

      {/* 🔔 الإشعار الاحترافي العائم (Toast Notification) */}
      {toast && (
        <div style={{
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
          background: toast.type === "success" ? "#059669" : "#dc2626",
          color: "#ffffff",
          fontWeight: "600",
          fontSize: "15px",
          animation: "toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          minWidth: "300px",
          maxWidth: "90%",
          justifyInContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>
              {toast.type === "success" ? "✅" : "⚠️"}
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

      {/* إضافة حركات CSS للإشعار */}
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

      {/* Header / Topbar */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        background: "linear-gradient(135deg, #2DAFBB 0%, #1C9BBB 100%)",
        padding: "16px",
        borderRadius: "16px",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
        borderBottom: "4px solid #EBC250",
        marginBottom: "24px",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        {/* الصف الأول: الترحيب (يمين) والشعار (أقصى اليسار) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%"
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ margin: 0, fontSize: "15px", color: "white", fontWeight: "bold", whiteSpace: "nowrap" }}>
              أهلاً بك، {student?.name} 👋
            </h2>
            <span style={{ fontSize: "12px", color: "#f8fafc", whiteSpace: "nowrap" }}>
              الرصيد: <strong style={{ fontSize: "14px", color: "#EBC250" }}>{remainingPoints} نقطة</strong>
            </span>
          </div>

          <img
            src="/logo3.png"
            alt="شعار نادي سمو الصيفي"
            style={{
              height: "38px",
              width: "auto",
              objectFit: "contain",
              borderRadius: "8px",
              background: "white",
              padding: "3px 8px",
              border: "1.5px solid #EBC250",
              flexShrink: 0
            }}
          />
        </div>

        {/* الصف الثاني: أزرار التحكم (تأخذ العرض بالكامل متساوية) */}
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          width: "100%"
        }}>
          <Link to="/store/cart" style={{ textDecoration: "none", flex: "1" }}>
            <button style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              background: "#EBC250",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "13px",
              whiteSpace: "nowrap"
            }}>
              🛒 السلة
              <span style={{
                color: "#2DAFBB",
                padding: "1px 6px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "bold",
                background: "white"
              }}>
                {cartCount}
              </span>
            </button>
          </Link>

          <button
            onClick={() => {
              if (onLogout) onLogout();
              else {
                localStorage.removeItem("mosque_student");
                localStorage.removeItem("mosque_cart");
                setStudent(null);
              }
            }}
            style={{
              flex: "1",
              background: "white",
              color: "#2DAFBB",
              border: "1px solid #fecaca",
              padding: "8px 12px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13px",
              whiteSpace: "nowrap",
              textAlign: "center"
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: category === c ? "#EBC250" : "#cbd5e1",
              background: category === c ? "#EBC250" : "#ffffff",
              color: category === c ? "white" : "#64748b",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.25s ease",
              boxShadow: category === c ? "0 4px 14px rgba(235, 194, 80, 0.35)" : "none"
            }}
          >
            {c === "All" ? "الكل" : c}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
        {products.map((p) => {
          const imageUrl = getImageUrl(p.imageUrl);
          const isAdding = loadingId === p._id;

          return (
            <div key={p._id} style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
            }}>
              <div>
                {/* صورة المنتج */}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "contain",
                      borderRadius: "10px",
                      marginBottom: "12px",
                      background: "#f8fafc",
                      boxSizing: "border-box"
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      const placeholder = document.createElement('div');
                      placeholder.style.cssText = `
                        width: 100%;
                        height: 160px;
                        background: #f8fafc;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #94a3b8;
                        margin-bottom: 12px;
                        font-size: 14px;
                      `;
                      placeholder.textContent = '📷 لا توجد صورة';
                      parent.appendChild(placeholder);
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "160px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    marginBottom: "12px",
                    fontSize: "14px"
                  }}>
                    📷 لا توجد صورة
                  </div>
                )}
                <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", color: "#64748b", fontWeight: "600" }}>{p.category}</span>
                <h3 style={{ margin: "8px 0 4px 0", fontSize: "16px", color: "#1e293b" }}>{p.name}</h3>
                <p style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "#2DAFBB" }}>{p.price} نقطة</p>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", marginBottom: "12px", border: "1px solid #f1f5f9" }}>
                  <button onClick={() => setQty(p._id, qty(p._id) - 1)} style={{ borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "bold", padding: "2px 8px" }}>➖</button>
                  <span style={{ fontWeight: "700", color: "#1e293b" }}>{qty(p._id)}</span>
                  <button onClick={() => setQty(p._id, qty(p._id) + 1)} style={{ borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "bold", padding: "2px 8px" }}>➕</button>
                </div>

                <button
                  disabled={isAdding}
                  onClick={() => handleAddToCart(p, qty(p._id))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: isAdding ? "#94a3b8" : "#2DAFBB",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(45, 175, 187, 0.2)"
                  }}
                >
                  {isAdding ? "جاري الإضافة..." : "أضف للسلة"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}