import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// Sound file for payment notification (cash register sound)
const PAYMENT_SOUND_URL = "/cekring.mp3";

const NotificationContext = createContext();

export const usePaymentNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("usePaymentNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const audioRef = useRef(null);
  const toastIdRef = useRef(0);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(PAYMENT_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
      setIsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setIsEnabled(permission === "granted");

      if (permission === "granted") {
        // Play test notification
        new Notification("Carramica Notifications", {
          body: "Notifikasi pembayaran aktif! Anda akan menerima pemberitahuan saat ada pembayaran.",
          icon: "/logo.png",
          tag: "welcome",
        });
      }

      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, []);

  // Disable notifications
  const disableNotifications = useCallback(() => {
    setIsEnabled(false);
    setSoundEnabled(false);
  }, []);

  // Play payment sound
  const playPaymentSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log("Audio play failed:", error);
      });
    }
  }, [soundEnabled]);

  // Show toast notification
  const showToast = useCallback((notification) => {
    const id = ++toastIdRef.current;
    const toast = {
      id,
      type: notification.type || "payment",
      title: notification.title || "Pembayaran Diterima!",
      message: notification.message || "",
      invoiceId: notification.invoiceId || notification.orderId || "",
      amount: notification.amount || 0,
      timestamp: new Date(),
      read: false,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto remove toast after 10 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 10000);

    return id;
  }, []);

  // Remove toast manually
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Mark toast as read
  const markAsRead = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, read: true } : t))
    );
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if (isEnabled && Notification.permission === "granted") {
      const browserNotification = new Notification(notification.title || "Pembayaran Baru!", {
        body: notification.message || `${notification.invoiceId} - Rp ${notification.amount?.toLocaleString("id-ID")}`,
        icon: "/logo192.png",
        badge: "/logo192.png",
        tag: `payment-${notification.invoiceId}`,
        requireInteraction: false,
        silent: !soundEnabled,
        vibrate: [200, 100, 200],
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }, [isEnabled, soundEnabled]);

  // Show payment notification (main function to call)
  const showPaymentNotification = useCallback((paymentData) => {
    const {
      invoiceId,
      orderId,
      amount,
      customerName,
      paymentMethod,
      items,
    } = paymentData;

    const displayId = invoiceId || orderId || "Unknown";
    const displayAmount = amount ? `Rp ${Number(amount).toLocaleString("id-ID")}` : "";
    const displayCustomer = customerName || "Pelanggan";

    const notificationData = {
      type: "payment",
      title: "💰 Pembayaran Diterima!",
      message: `${displayCustomer} - ${displayAmount}`,
      invoiceId: displayId,
      amount: amount,
      paymentMethod: paymentMethod,
      items: items,
    };

    // Play sound first
    playPaymentSound();

    // Show toast
    showToast(notificationData);

    // Show browser notification
    showBrowserNotification(notificationData);

    return notificationData;
  }, [playPaymentSound, showToast, showBrowserNotification]);

  const value = {
    toasts,
    isEnabled,
    soundEnabled,
    permissionStatus,
    setSoundEnabled,
    requestPermission,
    disableNotifications,
    showPaymentNotification,
    showToast,
    removeToast,
    markAsRead,
    clearAllToasts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} onMarkAsRead={markAsRead} />
    </NotificationContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onRemove, onMarkAsRead }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="payment-toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
      <style>{`
        .payment-toast-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 380px;
          width: 100%;
        }
        @media (max-width: 480px) {
          .payment-toast-container {
            left: 10px;
            right: 10px;
            top: 70px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onRemove, onMarkAsRead }) => {
  const formatCurrency = (amount) => {
    if (!amount) return "Rp 0";
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`payment-toast ${toast.read ? "read" : "unread"}`}
      onClick={() => onMarkAsRead(toast.id)}
      style={{
        background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)",
        borderRadius: "16px",
        padding: "16px 20px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        cursor: "pointer",
        animation: "slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "100px",
          height: "100px",
          background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)",
          borderRadius: "0 0 0 100%",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", position: "relative" }}>
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ffd700 0%, #ffb300 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            boxShadow: "0 4px 12px rgba(255, 215, 0, 0.4)",
            flexShrink: 0,
          }}
        >
          💰
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#ffd700",
              fontWeight: "700",
              fontSize: "14px",
              marginBottom: "4px",
              letterSpacing: "0.5px",
            }}
          >
            {toast.title}
          </div>
          <div style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "15px", fontWeight: "600", marginBottom: "2px" }}>
            {toast.message}
          </div>
          <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px" }}>
            Invoice: <span style={{ fontFamily: "monospace", color: "#ffd700" }}>{toast.invoiceId}</span>
          </div>
          <div
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Total
            </span>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>
              {formatCurrency(toast.amount)}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(toast.id);
          }}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "16px",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
            e.target.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          ×
        </button>
      </div>

      {/* Time indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "52px",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: "10px",
        }}
      >
        {formatTime(toast.timestamp)}
      </div>

      {/* Unread indicator */}
      {!toast.read && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#ff4757",
            boxShadow: "0 0 8px rgba(255, 71, 87, 0.5)",
          }}
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .payment-toast:hover {
          transform: translateX(-4px);
          box-shadow: 0 12px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15);
        }
        .payment-toast.read {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

// Floating Notification Button Component
export const NotificationFloatingButton = () => {
  const {
    isEnabled,
    soundEnabled,
    permissionStatus,
    requestPermission,
    disableNotifications,
    toasts,
    clearAllToasts,
    setSoundEnabled,
  } = usePaymentNotification();
  const [showSettings, setShowSettings] = useState(false);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  if (permissionStatus === "denied") {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "#ff4757",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            marginBottom: "8px",
            maxWidth: "200px",
            boxShadow: "0 4px 12px rgba(255, 71, 87, 0.3)",
          }}
        >
          ⚠️ Notifikasi diblokir. Aktifkan di pengaturan browser.
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
        }}
      >
        {/* Toast count badge */}
        {toasts.length > 0 && (
          <div
            onClick={clearAllToasts}
            style={{
              background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)",
              color: "#ffd700",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              animation: "pulse 2s infinite",
            }}
          >
            💰 {toasts.length} Pembayaran Baru
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              minWidth: "250px",
            }}
          >
            <div style={{ fontWeight: "700", marginBottom: "12px", color: "#333", fontSize: "14px" }}>
              🔔 Pengaturan Notifikasi
            </div>

            {/* Browser Notification */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#666" }}>Notifikasi Browser</span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: isEnabled ? "#d4edda" : "#f8d7da",
                    color: isEnabled ? "#155724" : "#721c24",
                  }}
                >
                  {isEnabled ? "ON" : "OFF"}
                </span>
              </div>
              {!isEnabled ? (
                <button
                  onClick={requestPermission}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #3D5E54 0%, #4a7c6f 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Aktifkan Notifikasi
                </button>
              ) : (
                <button
                  onClick={disableNotifications}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#f8d7da",
                    color: "#721c24",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Matikan Notifikasi
                </button>
              )}
            </div>

            {/* Sound toggle */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#666" }}>Suara Ka-ching</span>
                <button
                  onClick={toggleSound}
                  style={{
                    background: soundEnabled ? "#d4edda" : "#e9ecef",
                    border: "none",
                    borderRadius: "20px",
                    width: "44px",
                    height: "24px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: "2px",
                      left: soundEnabled ? "22px" : "2px",
                      transition: "left 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                    }}
                  >
                    {soundEnabled ? "🔔" : "🔕"}
                  </div>
                </button>
              </div>
            </div>

            {/* Clear notifications button */}
            {toasts.length > 0 && (
              <button
                onClick={clearAllToasts}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#fff3cd",
                  color: "#856404",
                  border: "1px solid #ffeaa7",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                🗑️ Hapus Semua Notifikasi
              </button>
            )}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: isEnabled
              ? "linear-gradient(135deg, #3D5E54 0%, #4a7c6f 100%)"
              : "#6c757d",
            border: "none",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            transition: "all 0.3s ease",
            position: "relative",
          }}
        >
          {isEnabled ? "🔔" : "🔕"}
          {toasts.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#ff4757",
                color: "#fff",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                fontSize: "11px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
              }}
            >
              {toasts.length > 9 ? "9+" : toasts.length}
            </div>
          )}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};

export default NotificationProvider;
