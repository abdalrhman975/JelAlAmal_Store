import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Cart({ 
  student, 
  setStudent, 
  cart = [], 
  removeFromCart, 
  clearCart, 
  updateQuantity 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const currentCart = student?.cart || cart || [];
  const totalPoints = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remainingPoints = (student?.points || 0) - totalPoints;

  useEffect(() => {
    fetchOrderHistory();
  }, [student?._id, student?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  async function fetchOrderHistory() {
    const studentId = student?._id || student?.id;
    if (!studentId) return;
    
    setLoadingHistory(true);
    try {
      const orders = await api.getStudentOrders(studentId);
      setOrderHistory(orders || []);
    } catch (err) {
      console.error("خطأ في جلب تاريخ الطلبات:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleQuantityChange(productId, currentQty, delta) {
    const newQty = currentQty + delta;
    const studentId = student?._id || student?.id;

    if (newQty <= 0) {
      await handleRemoveItem(productId);
      return;
    }

    if (delta > 0 && remainingPoints < (currentCart.find(i => (i.productId || i._id) === productId)?.price || 0)) {
      showToast("رصيد نقاطك المتبقي لا يكفي لزيادة الكمية!", "warning");
      return;
    }

    try {
      if (api.updateCartQuantity && studentId) {
        const res = await api.updateCartQuantity(studentId, productId, newQty);
        if (res?.student) {
          setStudent(res.student);
          localStorage.setItem("mosque_student", JSON.stringify(res.student));
        }
      } else if (updateQuantity) {
        updateQuantity(productId, newQty);
      }
    } catch (err) {
      showToast(err?.message || "حدث خطأ أثناء تعديل الكمية", "warning");
    }
  }

  async function handleRemoveItem(productId) {
    const studentId = student?._id || student?.id;
    try {
      if (api.removeFromCart && studentId) {
        const res = await api.removeFromCart(studentId, productId);
        if (res?.student) {
          setStudent(res.student);
          localStorage.setItem("mosque_student", JSON.stringify(res.student));
        }
      } else if (removeFromCart) {
        removeFromCart(productId);
      }
      showToast("تمت إزالة المنتج من السلة", "success");
    } catch (err) {
      showToast("حدث خطأ أثناء إزالة المنتج", "warning");
    }
  }

  async function handleCheckout() {
    if (currentCart.length === 0) return;

    if (remainingPoints < 0) {
      showToast("نقاطك الحالية لا تكفي لإتمام هذا الطلب!", "warning");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const studentId = student?._id || student?.id;
      const res = await api.submitOrder(studentId, currentCart);

      if (res && res.student) {
        setStudent(res.student);
        localStorage.setItem("mosque_student", JSON.stringify(res.student));
      }

      const newOrder = {
        items: [...currentCart],
        total: totalPoints,
        date: new Date().toLocaleString("ar-EG", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        orderId: res?.order?._id || Date.now()
      };

      setLastOrder(newOrder);
      setOrderHistory(prev => [newOrder, ...prev]);

      if (clearCart) clearCart();

      showToast("تم تأكيد الطلب وخصم النقاط بنجاح! 🎉", "success");
    } catch (err) {
      const errMsg = err?.message || "حدث خطأ أثناء الشراء";
      setError(errMsg);
      showToast(errMsg, "warning");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px", position: "relative", boxSizing: "border-box" }}>
      
      {/* 🔔 الإشعار الاحترافي */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 20px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          background: toast.type === "success" ? "#059669" : "#dc2626",
          color: "#ffffff",
          fontWeight: "600",
          fontSize: "14px",
          width: "90%",
          maxWidth: "400px",
          justifyBetween: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Header المحدث */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "20px",
        background: "white",
        padding: "16px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>🛒 سلة التسوق</h2>
          <Link to="/store" style={{ textDecoration: "none" }}>
            <button style={{
              background: "#f1f5f9",
              color: "#475569",
              border: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer"
            }}>
              العودة للسوق
            </button>
          </Link>
        </div>

        {student && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            background: "#f8fafc",
            borderRadius: "10px",
            fontSize: "13px"
          }}>
            <span style={{ color: "#64748b" }}>الرصيد الكلي: <strong>{student.points || 0}</strong></span>
            <span style={{ color: remainingPoints < 0 ? "#dc2626" : "#059669", fontWeight: "700" }}>
              المتبقي: {remainingPoints} نقطة
            </span>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{
          color: "#dc2626",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "16px",
          fontWeight: "600",
          textAlign: "center",
          fontSize: "13px"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Cart Content (Cards instead of Table) */}
      {currentCart.length === 0 ? (
        <div style={{
          background: "white",
          padding: "40px 20px",
          borderRadius: "16px",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <p style={{ fontSize: "36px", margin: "0 0 8px 0" }}>🛍️</p>
          <p style={{ margin: 0, color: "#64748b", fontSize: "15px", fontWeight: "600" }}>
            السلة فارغة حالياً
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          {currentCart.map((item) => (
            <div key={item.productId || item._id} style={{
              background: "white",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b" }}>{item.name}</span>
                <span style={{ color: "#2DAFBB", fontWeight: "700", fontSize: "14px" }}>
                  {item.price * item.quantity} نقطة
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed #f1f5f9" }}>
                {/* عداد الكمية */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "4px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <button onClick={() => handleQuantityChange(item.productId || item._id, item.quantity, -1)} style={{ border: "none", background: "white", cursor: "pointer", borderRadius: "4px", padding: "2px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontWeight: "bold" }}>➖</button>
                  <span style={{ fontWeight: "700", fontSize: "14px" }}>{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.productId || item._id, item.quantity, 1)} style={{ border: "none", background: "white", cursor: "pointer", borderRadius: "4px", padding: "2px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontWeight: "bold" }}>➕</button>
                </div>

                {/* زر الحذف */}
                <button
                  onClick={() => handleRemoveItem(item.productId || item._id)}
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "12px"
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}

          {/* Checkout Bar */}
          <div style={{
            background: "white",
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "8px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b", fontSize: "14px" }}>الإجمالي الكلي:</span>
              <h3 style={{ margin: 0, color: "#2DAFBB", fontSize: "20px" }}>
                {totalPoints} نقطة
              </h3>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || remainingPoints < 0}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "15px",
                background: remainingPoints < 0 ? "#cbd5e1" : "linear-gradient(135deg, #2DAFBB 0%, #1C9BBB 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: (loading || remainingPoints < 0) ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {loading ? "جاري الإرسال..." : remainingPoints < 0 ? "النقاط لا تكفي" : "تأكيد وإرسال الطلب ✨"}
            </button>
          </div>
        </div>
      )}

      {/* تاريخ المشتريات */}
      {(lastOrder || orderHistory.length > 0) && (
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ color: "#1e293b", fontSize: "16px", marginBottom: "12px" }}>
            📋 تاريخ المشتريات ({orderHistory.length})
          </h3>

          {loadingHistory && <div style={{ textAlign: "center", padding: "12px", fontSize: "13px" }}>جاري التحميل...</div>}

          {orderHistory.map((order, index) => (
            <div
              key={order.orderId || order._id || index}
              style={{
                background: index === 0 && lastOrder ? "#f0fdf4" : "white",
                border: index === 0 && lastOrder ? "1.5px solid #bbf7d0" : "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "13px", color: "#334155" }}>طلب #{orderHistory.length - index}</span>
                {index === 0 && lastOrder && (
                  <span style={{ background: "#22c55e", color: "white", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>
                    تم الآن
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {order.items?.map((item, idx) => (
                  <div key={item.productId || idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", fontSize: "12px" }}>
                    <span>{item.name}</span>
                    <span style={{ color: "#64748b" }}>{item.quantity} × {item.price}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px dashed #e2e8f0", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>الإجمالي:</span>
                <span style={{ fontWeight: "700", color: "#2DAFBB" }}>
                  {order.total || order.items?.reduce((sum, i) => sum + i.price * i.quantity, 0)} نقطة
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}