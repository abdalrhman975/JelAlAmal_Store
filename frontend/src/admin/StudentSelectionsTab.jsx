import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function StudentSelectionsTab() {
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSelections();
  }, []);

  async function loadSelections() {
    try {
      setLoading(true);
      if (api.getStudentSelections) {
        const data = await api.getStudentSelections();
        setSelections(data || []);
      }
    } catch (error) {
      console.error("خطأ في جلب الطلبات التفصيلية:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStrike(orderId, currentStatus) {
    const newStatus = !currentStatus;
    if (api.updateOrderStatus) {
      await api.updateOrderStatus(orderId, newStatus);
    }
    setSelections((prev) =>
      prev.map((item) =>
        item._id === orderId ? { ...item, isStruck: newStatus } : item
      )
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
      }}
    >
      <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "18px", fontWeight: "700" }}>
        📋 قائمة طلبات الطلاب التفصيلية
      </h3>

      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: "14px" }}>
          ⏳ جاري جلب الطلبات التفصيلية...
        </div>
      ) : selections.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#94a3b8",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            fontSize: "14px"
          }}
        >
          📦 لا توجد أي طلبات تفصيلية حالياً
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "#f8fafc", fontSize: "13px", color: "#475569" }}>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>اسم الطالب</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>المنتجات المطلوبة</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>إجمالي النقاط</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>حالة الطلب</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {selections.map((sel) => {
                const isStruck = sel.isStruck || false;
                return (
                  <tr
                    key={sel._id}
                    style={{
                      background: isStruck ? "#fafbfc" : "#ffffff",
                      opacity: isStruck ? 0.7 : 1,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: "600",
                        color: "#1e293b",
                        borderBottom: "1px solid #f1f5f9",
                        textDecoration: isStruck ? "line-through" : "none"
                      }}
                    >
                      👤 {sel.studentName}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        textDecoration: isStruck ? "line-through" : "none"
                      }}
                    >
                      {sel.items?.map((item, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: "inline-block",
                            background: "#f1f5f9",
                            color: "#334155",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            margin: "2px",
                            fontSize: "13px",
                            fontWeight: "500"
                          }}
                        >
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#2DAFBB",
                        fontWeight: "700",
                        borderBottom: "1px solid #f1f5f9",
                        textDecoration: isStruck ? "line-through" : "none"
                      }}
                    >
                      {sel.totalPoints} نقطة
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {isStruck ? (
                        <span
                          style={{
                            color: "#ef4444",
                            fontWeight: "600",
                            background: "#fef2f2",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            display: "inline-block"
                          }}
                        >
                          مكتمِل / مشطوب
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#2563eb",
                            fontWeight: "600",
                            background: "#eff6ff",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            display: "inline-block"
                          }}
                        >
                          قيد الانتظار
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {isStruck ? (
                        <button
                          onClick={() => toggleStrike(sel._id, isStruck)}
                          style={{
                            background: "#f0fdf4",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          ↩️ إلغاء الشطب
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStrike(sel._id, isStruck)}
                          style={{
                            background: "#fef2f2",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          ✂️ شطب الطلب
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}