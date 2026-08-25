import { useState } from "react";
import StudentsTab from "./StudentsTab.jsx";
import ProductsTab from "./ProductsTab.jsx";
import QuantitiesTab from "./QuantitiesTab.jsx";
import OrdersTab from "./OrdersTab.jsx";

const TABS = [
  { key: "students", label: "👥 إدارة الطلاب", Comp: StudentsTab },
  { key: "products", label: "📦 محتويات السوق", Comp: ProductsTab },
  { key: "quantities", label: "📊 كميات الطلبات", Comp: QuantitiesTab },
  { key: "orders", label: "📋 قائمة الطلبات", Comp: OrdersTab },
];

export default function AdminApp() {
  const [active, setActive] = useState("students");
  const ActiveComp = TABS.find((t) => t.key === active)?.Comp || StudentsTab;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 16px" }}>
      {/* الهيدر الرئيسي */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          padding: "20px 28px",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "6px",
              height: "22px",
              background: "#2DAFBB",
              borderRadius: "4px"
            }}
          />
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "-0.3px" }}>
            ⚙️ لوحة التحكم والإدارة
          </h1>
        </div>
      </div>

      {/* شريط التبويبات (Segmented Tabs Bar) */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          background: "#ffffff",
          padding: "6px",
          borderRadius: "12px",
          border: "1px solid #f1f5f9",
          marginBottom: "24px",
          overflowX: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                padding: "10px 22px",
                borderRadius: "9px",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                transition: "all 0.2s ease",
                background: isActive ? "#2DAFBB" : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                boxShadow: isActive ? "0 2px 8px rgba(45, 175, 187, 0.3)" : "none",
                whiteSpace: "nowrap"
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* المحتوى النشط للتبويب */}
      <div className="admin-content">
        <ActiveComp />
      </div>
    </div>
  );
}