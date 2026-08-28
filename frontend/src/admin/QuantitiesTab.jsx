import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { api } from "../api.js";

export default function QuantitiesTab() {
  const [quantities, setQuantities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadQuantitiesData();
  }, []);

  // ==========================================
  // تحميل وتجميع الكميات
  // ==========================================
  async function loadQuantitiesData() {
    try {
      setLoading(true);

      let data = null;

      // 1. جلب الكميات المجمعة مباشرة من السيرفر
      try {
        if (typeof api.getOrderQuantities === "function") {
          data = await api.getOrderQuantities();
        }
      } catch (e) {
        console.warn(
          "تعذر جلب الكميات المجمعة، جاري محاولة جلب قائمة الطلبات الخام..."
        );
      }

      // 2. المحاولة الثانية: جلب قائمة الطلبات
      if (!data || (Array.isArray(data) && data.length === 0)) {
        if (typeof api.getOrders === "function") {
          data = await api.getOrders();
        } else if (typeof api.getStudentSelections === "function") {
          data = await api.getStudentSelections();
        }
      }

      const result = aggregateProductQuantities(data);

      setQuantities(result);
    } catch (err) {
      console.error("خطأ أثناء تحميل كميات المنتجات:", err);
      setQuantities([]);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // تجميع كميات المنتجات
  // ==========================================
  function aggregateProductQuantities(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    const firstItem = data[0];

    // ==========================================
    // الحالة 1:
    // البيانات قادمة مجمعة من السيرفر
    // ==========================================
    if (
      firstItem.totalQuantity !== undefined ||
      firstItem.totalRequested !== undefined ||
      firstItem._id
    ) {
      return data
        .map((item) => ({
          name: item.name || item._id || "منتج غير معنون",
          totalQuantity: Number(
            item.totalQuantity || item.totalRequested || 0
          ),
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity);
    }

    // ==========================================
    // الحالة 2:
    // تجميع الطلبات التفصيلية من جهة العميل
    // ==========================================
    const countsMap = {};

    data.forEach((order) => {
      const items =
        order.items ||
        order.products ||
        order.cart ||
        [];

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const productName =
            item.name ||
            item.product?.name ||
            "منتج غير معنون";

          const qty = Number(item.quantity || 1);

          countsMap[productName] =
            (countsMap[productName] || 0) + qty;
        });
      }
    });

    return Object.keys(countsMap)
      .map((name) => ({
        name,
        totalQuantity: countsMap[name],
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  // ==========================================
  // تحميل المنتجات
  // ==========================================
  async function loadProducts() {
    try {
      const data = await api.getProducts("All");

      setProducts(data);

      // مهم:
      // نرجع البيانات حتى نستخدمها مباشرة
      // داخل exportToExcel
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("خطأ في تحميل المنتجات:", error);
      return [];
    }
  }

  // ==========================================
  // تصدير Excel
  // ==========================================
  async function exportToExcel() {
    if (!quantities.length) {
      return alert("لا توجد بيانات كميات للتصدير حالياً.");
    }

    try {
      // تحميل المنتجات للحصول على التصنيف
      const productsData = await loadProducts();

      const exportData = quantities.map((q, idx) => {
        // البحث عن المنتج
        const product = productsData.find(
          (p) =>
            String(p.name || "").trim() ===
            String(q.name || "").trim()
        );

        return {
          "م": idx + 1,

          "اسم المنتج": q.name,

          "التصنيف": product?.category || "غير محدد",

          "إجمالي الكمية المطلوبة": q.totalQuantity,
        };
      });

      // إنشاء ورقة Excel
      const ws = XLSX.utils.json_to_sheet(exportData);

      // إنشاء ملف Excel
      const wb = XLSX.utils.book_new();

      // إضافة الورقة للملف
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        "الكميات المطلوبة"
      );

      // تحسين عرض الأعمدة
      ws["!cols"] = [
        { wch: 8 },  // م
        { wch: 35 }, // اسم المنتج
        { wch: 20 }, // التصنيف
        { wch: 25 }, // الكمية
      ];

      // اسم الملف
      const fileName = `كميات_المنتجات_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      // تحميل الملف
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("خطأ أثناء تصدير Excel:", error);

      alert(
        "حدث خطأ أثناء تصدير ملف Excel. يرجى المحاولة مرة أخرى."
      );
    }
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* ================================
          Header
      ================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "#1e293b",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            📊 ملخص كميات المنتجات المطلوبة
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            حصر تلقائي شامِل لجميع المنتجات المطلوبة في النظام
          </p>
        </div>

        {/* زر التصدير */}
        <button
          onClick={exportToExcel}
          disabled={quantities.length === 0}
          style={{
            background:
              quantities.length === 0
                ? "#cbd5e1"
                : "#16a34a",

            color: "white",

            border: "none",

            padding: "10px 18px",

            borderRadius: "10px",

            fontWeight: "600",

            cursor:
              quantities.length === 0
                ? "not-allowed"
                : "pointer",

            fontSize: "14px",

            boxShadow:
              quantities.length === 0
                ? "none"
                : "0 2px 6px rgba(22, 163, 74, 0.2)",

            display: "flex",

            alignItems: "center",

            gap: "8px",

            transition: "all 0.2s ease",
          }}
        >
          📥 تصدير الكميات إلى Excel
        </button>
      </div>

      {/* ================================
          Loading
      ================================= */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            color: "#64748b",
            padding: "40px 0",
            fontSize: "14px",
          }}
        >
          ⏳ جاري جلب وحساب الكميات...
        </div>
      ) : quantities.length === 0 ? (
        /* ================================
           No Data
        ================================= */
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#94a3b8",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            fontSize: "14px",
          }}
        >
          📦 لا توجد أي طلبات مسجلة في النظام حتى الآن
        </div>
      ) : (
        /* ================================
           Table
        ================================= */
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0",
              textAlign: "right",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  اسم المنتج
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      "1px solid #f1f5f9",
                    textAlign: "center",
                  }}
                >
                  إجمالي الكمية المطلوبة
                </th>
              </tr>
            </thead>

            <tbody>
              {quantities.map((item, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: "600",
                      color: "#1e293b",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {item.name}
                  </td>

                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "center",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    <span
                      style={{
                        background: "#e6f7f8",
                        color: "#2DAFBB",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontWeight: "700",
                        fontSize: "13px",
                        display: "inline-block",
                      }}
                    >
                      {item.totalQuantity} قطعة
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
