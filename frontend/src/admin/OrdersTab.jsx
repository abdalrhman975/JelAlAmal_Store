import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const data = await api.getStudentSelections();
    setOrders(data || []);
  }

  // تجميع الطلبات حسب الطالب
  const groupedOrders = orders.reduce((acc, order) => {
    const studentId = order.student?._id || "deleted";
    const studentName = order.student?.name || "طالب محذوف";

    if (!acc[studentId]) {
      acc[studentId] = {
        name: studentName,
        totalSpent: 0,
        orders: [],
      };
    }
    acc[studentId].orders.push(order);
    acc[studentId].totalSpent += order.totalPoints;
    return acc;
  }, {});

    const studentsCount = Object.keys(groupedOrders).length;

  const toggleStudent = (studentId) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  async function handleToggleDeliver(orderId) {
    await api.updateOrderStatus(orderId);
    loadOrders();
  }

  function exportOrdersToExcel() {
    const headers = ["اسم الطالب", "المنتجات", "إجمالي النقاط", "الحالة", "التاريخ"];
    const rows = orders.map((o) => [
      `"${o.student?.name || "طالب محذوف"}"`,
      `"${o.items.map((i) => `${i.name} (${i.quantity})`).join(" + ")}"`,
      o.totalPoints,
      `"${o.status === "delivered" ? "تم التسليم" : "قيد الانتظار"}"`,
      `"${new Date(o.createdAt).toLocaleDateString("ar-EG")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `جدول_الطلبات_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <div style={{ background: "#ffffff", padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)", boxSizing: "border-box", width: "100%" }}>
      {/* رأس التبويب والأزرار */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
          📋 طلبات الطلاب <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal", display: "block", marginTop: "2px" }}>(انقر على اسم الطالب للتفاصيل)</span>
          <span>{studentsCount}</span>
        </h3>
        <button
          onClick={exportOrdersToExcel}
          style={{
            background: "#16a34a",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
            width: "100%",
            justifyContent: "center"
          }}
        >
          📥 تصدير الكل إلى Excel
        </button>
      </div>

      {/* قائمة طلبات الطلاب (الأكوردبيون) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Object.entries(groupedOrders).map(([studentId, group]) => {
          const isExpanded = expandedStudentId === studentId;
          return (
            <div key={studentId} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", transition: "all 0.2s ease" }}>
              {/* رأس بطاقة الطالب */}
              {/* رأس بطاقة الطالب */}
              <div
                onClick={() => toggleStudent(studentId)}
                style={{
                  background: isExpanded ? "#fafbfc" : "#ffffff",
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between", // يدفعهما على أطراف البطاقة
                  alignItems: "center",
                  userSelect: "none",
                  borderRight: isExpanded ? "4px solid #2DAFBB" : "4px solid transparent",
                  gap: "12px"
                }}
              >
                {/* الجهة اليمنى: اسم الطالب */}
                <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                  👤 {group.name}
                </div>

                {/* الجهة اليسرى: مجموع النقاط + السهم بمسافة واضحة */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "4px 12px", borderRadius: "20px", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    مجموع النقاط: <strong style={{ color: "#2DAFBB" }}>{group.totalSpent}</strong>
                  </span>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* تفاصيل الطلبات عند التوسيع (بدون جدول) */}
              {isExpanded && (
                <div style={{ padding: "12px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {group.orders.map((o) => (
                    <div
                      key={o._id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      {/* قائمة المنتجات */}
                      <div style={{ marginBottom: "10px" }}>
                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                          المنتجات المطلوبة:
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {o.items.map((item, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              {item.name} <b style={{ color: "#0284c7" }}>× {item.quantity}</b>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* البيانات السفلية (النقاط + التاريخ) */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "12px", color: "#475569" }}>
                        <span>النقاط: <strong style={{ color: "#2DAFBB" }}>{o.totalPoints}</strong></span>
                        <span>📅 {new Date(o.createdAt).toLocaleDateString("ar-EG")}</span>
                      </div>

                      {/* الحالة والإجراء */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed #f1f5f9" }}>
                        {o.status === "delivered" ? (
                          <span style={{ color: "#16a34a", fontWeight: "600", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}>
                            ✅ تم التسليم
                          </span>
                        ) : (
                          <span style={{ color: "#d97706", fontWeight: "600", background: "#fffbebe1", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}>
                            ⏳ قيد الانتظار
                          </span>
                        )}

                        {o.status !== "delivered" && (
                          <button
                            onClick={() => handleToggleDeliver(o._id)}
                            style={{
                              background: "#2DAFBB",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                              boxShadow: "0 2px 4px rgba(45, 175, 187, 0.2)"
                            }}
                          >
                            تم التسليم
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}