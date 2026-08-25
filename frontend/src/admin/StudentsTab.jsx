import { useState, useEffect } from "react";
import { api } from "../api.js";
import * as XLSX from "xlsx";

const generate5DigitPassword = () => Math.floor(10000 + Math.random() * 90000).toString();

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // حالة نموذج الإضافة اليدوية
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState(0);
  const [password, setPassword] = useState(generate5DigitPassword());

  // حالة نموذج التعديل (Modal)
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPoints, setEditPoints] = useState(0);
  const [editPassword, setEditPassword] = useState("");

  // حالة الإشعار الاحترافي (Toast)
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' | 'error' }

  useEffect(() => {
    loadStudents();
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

  async function loadStudents() {
    try {
      setFetching(true);
      const data = await api.getStudents();
      setStudents(data || []);
    } catch (err) {
      console.error("خطأ في جلب بيانات الطلاب:", err);
    } finally {
      setFetching(false);
    }
  }

  // إضافة طالب يدوياً
  async function handleAddManual(e) {
    e.preventDefault();
    if (!name.trim()) return showToast("يرجى كتابة اسم الطالب", "warning");

    try {
      await api.addStudent({ name, phone, points, password });
      showToast("تمت إضافة الطالب بنجاح! 🎉", "success");
      setName("");
      setPhone("");
      setPoints(0);
      setPassword(generate5DigitPassword());
      loadStudents();
    } catch (err) {
      showToast("خطأ: " + err.message, "error");
    }
  }

  // فتح نافذة التعديل وتعبئة البيانات الحالية
  function handleOpenEditModal(student) {
    setEditingStudent(student);
    setEditName(student.name || "");
    setEditPhone(student.phone || "");
    setEditPoints(student.points || 0);
    setEditPassword(student.password || "");
  }

  // حفظ التعديلات
  async function handleUpdateStudent(e) {
    e.preventDefault();
    if (!editName.trim()) return showToast("يرجى كتابة اسم الطالب", "warning");

    try {
      await api.updateStudent(editingStudent._id, {
        name: editName,
        phone: editPhone,
        points: Number(editPoints),
        password: editPassword,
      });
      showToast("تم تحديث بيانات الطالب بنجاح! ✏️", "success");
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      showToast("خطأ أثناء التعديل: " + err.message, "error");
    }
  }

  // حذف طالب
  async function handleDelete(id) {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    try {
      await api.deleteStudent(id);
      showToast("تم حذف الطالب بنجاح", "success");
      loadStudents();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDeleteAll() {
    if (!students.length) return showToast("لا يوجد طلاب لحذفهم.", "warning");

    if (!confirm("⚠️ تحذير: هل أنت متأكد تماماً من حذف جميع الطلاب؟ لا يمكن التراجع عن هذه الخطوة!")) return;

    try {
      await api.deleteAllStudents();
      showToast("تم حذف جميع الطلاب بنجاح 🗑️", "success");
      loadStudents();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // استيراد من ملف Excel
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

        const formattedStudents = data.map((item) => ({
          name: item["اسم الطالب"] || item["الاسم"] || item["name"] || "بدون اسم",
          phone: String(item["رقم الواتس"] || item["الواتس"] || item["الهاتف"] || item["phone"] || ""),
          points: Number(item["عدد النقاط"] || item["النقاط"] || item["points"] || 0),
          password: item["كلمة السر"] || item["password"] ? String(item["كلمة السر"] || item["password"]) : generate5DigitPassword(),
        }));

        await api.bulkCreateStudents(formattedStudents);
        showToast(`تمت إضافة ${formattedStudents.length} طالب بنجاح! 🎉`, "success");
        loadStudents();
      } catch (err) {
        showToast("حدث خطأ أثناء قراءة الملف: " + err.message, "error");
      } finally {
        setLoading(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
  }

  function exportStudentsToExcel() {
    if (!students.length) return showToast("لا توجد بيانات طلاب للتصدير حالياً.", "warning");

    const headers = ["اسم الطالب", "رقم الواتس", "كلمة السر (صريحة)", "النقاط"];
    const rows = students.map((s) => [
      `"${s.name}"`,
      `"${s.phone || ""}"`,
      `"${s.password}"`,
      s.points,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `قائمة_الطلاب_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("تم تصدير ملف الطلاب بنجاح! 📥", "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>

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
          background: toast.type === "success" ? "#059669" : toast.type === "warning" ? "#d97706" : "#dc2626",
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

      {/* 1. نموذج إضافة طالب جديد */}
      <div
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
          ➕ إضافة طالب جديد
        </h4>

        <form onSubmit={handleAddManual} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2", minWidth: "180px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
              اسم الطالب
            </label>
            <input
              type="text"
              placeholder="اسم الطالب"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div style={{ flex: "1.5", minWidth: "140px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
              رقم الواتس
            </label>
            <input
              type="text"
              placeholder="05XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ flex: "1", minWidth: "90px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
              النقاط
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ flex: "1.5", minWidth: "170px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
              كلمة السر (تلقائية)
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "6px 12px",
                height: "43px",
                boxSizing: "border-box"
              }}
            >
              <span style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: "700", color: "#1e293b", letterSpacing: "2px" }}>
                {password}
              </span>
              <button
                type="button"
                onClick={() => setPassword(generate5DigitPassword())}
                title="توليد رقم جديد"
                style={{
                  background: "#e2e8f0",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#334155",
                  transition: "all 0.2s ease"
                }}
              >
                🔄
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: "#2DAFBB",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              height: "43px",
              boxShadow: "0 2px 6px rgba(45, 175, 187, 0.25)",
              transition: "all 0.2s ease"
            }}
          >
            حفظ الطالب
          </button>
        </form>
      </div>

      {/* 2. شريط الأدوات وجدول عرض الطلاب */}
      <div
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px"
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>
            👥 قائمة الطلاب ({students.length})
          </h3>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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

            <button
              onClick={exportStudentsToExcel}
              disabled={students.length === 0}
              style={{
                background: students.length === 0 ? "#cbd5e1" : "#f0fdf4",
                color: students.length === 0 ? "#94a3b8" : "#16a34a",
                border: students.length === 0 ? "1px solid #cbd5e1" : "1px solid #bbf7d0",
                padding: "8px 16px",
                borderRadius: "10px",
                cursor: students.length === 0 ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              📥 تصدير الطلاب إلى Excel
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={students.length === 0}
              style={{
                background: students.length === 0 ? "#cbd5e1" : "#fef2f2",
                color: students.length === 0 ? "#94a3b8" : "#dc2626",
                border: students.length === 0 ? "1px solid #cbd5e1" : "1px solid #fecaca",
                padding: "8px 16px",
                borderRadius: "10px",
                cursor: students.length === 0 ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              🗑️ حذف الجميع
            </button>
          </div>
        </div>

        {/* 3. حالة التحميل والتفرغ والجدول */}
        {fetching ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: "14px" }}>
            ⏳ جاري جلب قائمة الطلاب...
          </div>
        ) : students.length === 0 ? (
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
            👥 لا يوجد طلاب مسجلون حالياً
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "#f8fafc", fontSize: "13px", color: "#475569" }}>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>🧑‍🦰 اسم الطالب</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>☎️ رقم الواتس</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>🔑 كلمة السر</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>💯 النقاط</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>📃 الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>
                      {s.name}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#2563eb", direction: "ltr", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      {s.phone || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          fontWeight: "700",
                          border: "1px solid #e2e8f0",
                          letterSpacing: "1px"
                        }}
                      >
                        {s.password}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#2DAFBB", fontWeight: "700", borderBottom: "1px solid #f1f5f9" }}>
                      {s.points} نقطة
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          style={{
                            background: "#f0fdf4",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.2s ease"
                          }}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          style={{
                            background: "#fef2f2",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.2s ease"
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. نافذة التعديل المنبثقة (Edit Modal) */}
      {editingStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                ✏️ تعديل بيانات الطالب
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  اسم الطالب
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  رقم الواتس
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    النقاط
                  </label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    كلمة السر
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontFamily: "monospace",
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditPassword(generate5DigitPassword())}
                      title="توليد رقم جديد"
                      style={{
                        background: "#e2e8f0",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0 10px",
                        cursor: "pointer"
                      }}
                    >
                      🔄
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: "#2DAFBB",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}