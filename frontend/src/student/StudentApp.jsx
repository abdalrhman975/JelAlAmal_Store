import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login.jsx";
import Market from "./Market.jsx";
import Cart from "./Cart.jsx";

export default function StudentApp() {
  const [student, setStudent] = useState(() => {
    try {
      const saved = localStorage.getItem("mosque_student");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("خطأ في قراءة بيانات الطالب:", e);
      return null;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("mosque_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("خطأ في قراءة السلة:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("mosque_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (student) {
      localStorage.setItem("mosque_student", JSON.stringify(student));
    } else {
      localStorage.removeItem("mosque_student");
    }
  }, [student]);

  function handleLogout() {
    setStudent(null);
    setCart([]);
    localStorage.removeItem("mosque_student");
    localStorage.removeItem("mosque_cart");
  }

  function addToCart(product, quantity) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity
        },
      ];
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem("mosque_cart");
  }

  function updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: newQty } : item))
    );
  }

  if (!student) {
    return <Login onLogin={setStudent} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Market
            student={student}
            setStudent={setStudent}
            onLogout={handleLogout}
            cart={cart}
            addToCart={addToCart}
          />
        }
      />
      <Route
        path="/cart"
        element={
          <Cart
            student={student}
            setStudent={setStudent}
            onLogout={handleLogout}
            cart={cart}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            updateQuantity={updateQuantity}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}