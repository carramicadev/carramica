import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useSnackbar } from "notistack";
import { firestore, functions } from "../../FirebaseFrovider";
import {
  ArrowCounterclockwise,
  CheckCircle,
  XCircle,
  Plug,
  Play,
  Pause,
  Gear,
  Database,
  Link as LinkIcon
} from "react-bootstrap-icons";

const DESTY_WAREHOUSE_ID = "crm-warehouse";
const DESTY_API_BASE = "https://api.desty.app";

const DestySettings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Safety Config State
  const [safetyConfig, setSafetyConfig] = useState({
    stockDeductionEnabled: false,
    dryRunMode: true,
    confirmedStatuses: ["Ready_To_Ship"],
    idempotencyEnabled: true,
    logLevel: "verbose",
  });

  // Sync Config State
  const [syncConfig, setSyncConfig] = useState({
    syncStockOnWebhook: true,
    syncWeight: true,
    syncPrice: false,
    syncImages: false,
    pushStockAfterSettlement: true,
    syncOnlyFromGudangOnline: true,
    autoSyncEnabled: false,
  });

  // Webhook Config State
  const [webhookConfig, setWebhookConfig] = useState({
    enabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
    validateSignature: false,
  });

  // General Config State
  const [generalConfig, setGeneralConfig] = useState({
    warehouseId: DESTY_WAREHOUSE_ID,
    apiBase: DESTY_API_BASE,
    applyId: "e384d7c6-b5a0-46ef-8165-e7cc4ffbb3fe",
    username: "+6281215571500",
    mobile: "+6281215571500",
  });

  // Logs State
  const [pushLogs, setPushLogs] = useState([]);
  const [orderLogs, setOrderLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("overview");

  // Status options for confirmed statuses
  const statusOptions = [
    "Pending",
    "Confirmed",
    "Processing",
    "Ready_To_Ship",
    "Shipping",
    "Completed",
    "Cancelled",
  ];

  // Load all configs on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        await Promise.all([
          loadSafetyConfig(true),
          loadSyncConfig(),
          loadWebhookConfig(),
          loadGeneralConfig()
        ]);
      } catch (error) {
        console.error("Error loading configs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Load safety config from Firestore
  const loadSafetyConfig = async (isMainLoader = false) => {
    try {
      const docRef = doc(firestore, "desty_settings", "safety_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSafetyConfig(docSnap.data());
      } else {
        const defaultConfig = {
          stockDeductionEnabled: false,
          dryRunMode: true,
          confirmedStatuses: ["Ready_To_Ship"],
          idempotencyEnabled: true,
          logLevel: "verbose",
        };
        await setDoc(docRef, defaultConfig);
        setSafetyConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Error loading safety config:", error);
      if (isMainLoader) {
        setLoading(false);
      }
    }
  };

  // Load sync config from Firestore
  const loadSyncConfig = async () => {
    try {
      const docRef = doc(firestore, "desty_settings", "sync_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSyncConfig(docSnap.data());
      } else {
        const defaultConfig = {
          syncStockOnWebhook: true,
          syncWeight: true,
          syncPrice: false,
          syncImages: false,
          pushStockAfterSettlement: true,
          syncOnlyFromGudangOnline: true,
          autoSyncEnabled: false,
        };
        await setDoc(docRef, defaultConfig);
        setSyncConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Error loading sync config:", error);
    }
  };

  // Load webhook config from Firestore
  const loadWebhookConfig = async () => {
    try {
      const docRef = doc(firestore, "desty_settings", "webhook_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWebhookConfig(docSnap.data());
      } else {
        const defaultConfig = {
          enabled: true,
          retryCount: 3,
          retryDelayMs: 1000,
          validateSignature: false,
        };
        await setDoc(docRef, defaultConfig);
        setWebhookConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Error loading webhook config:", error);
    }
  };

  // Load general config from Firestore
  const loadGeneralConfig = async () => {
    try {
      const docRef = doc(firestore, "desty_settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGeneralConfig(docSnap.data());
      } else {
        const defaultConfig = {
          warehouseId: DESTY_WAREHOUSE_ID,
          apiBase: DESTY_API_BASE,
          applyId: "e384d7c6-b5a0-46ef-8165-e7cc4ffbb3fe",
          username: "+6281215571500",
          mobile: "+6281215571500",
        };
        await setDoc(docRef, defaultConfig);
        setGeneralConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Error loading general config:", error);
    }
  };

  // Save safety config
  const saveSafetyConfig = async () => {
    try {
      setSaving(true);
      const docRef = doc(firestore, "desty_settings", "safety_config");
      await setDoc(docRef, safetyConfig);
      enqueueSnackbar("Konfigurasi safety berhasil disimpan!", { variant: "success" });
    } catch (error) {
      console.error("Error saving safety config:", error);
      enqueueSnackbar("Gagal menyimpan konfigurasi safety", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Save sync config
  const saveSyncConfig = async () => {
    try {
      setSaving(true);
      const docRef = doc(firestore, "desty_settings", "sync_config");
      await setDoc(docRef, syncConfig);
      enqueueSnackbar("Konfigurasi sync berhasil disimpan!", { variant: "success" });
    } catch (error) {
      console.error("Error saving sync config:", error);
      enqueueSnackbar("Gagal menyimpan konfigurasi sync", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Save webhook config
  const saveWebhookConfig = async () => {
    try {
      setSaving(true);
      const docRef = doc(firestore, "desty_settings", "webhook_config");
      await setDoc(docRef, webhookConfig);
      enqueueSnackbar("Konfigurasi webhook berhasil disimpan!", { variant: "success" });
    } catch (error) {
      console.error("Error saving webhook config:", error);
      enqueueSnackbar("Gagal menyimpan konfigurasi webhook", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Save general config
  const saveGeneralConfig = async () => {
    try {
      setSaving(true);
      const docRef = doc(firestore, "desty_settings", "config");
      await setDoc(docRef, generalConfig);
      enqueueSnackbar("Konfigurasi umum berhasil disimpan!", { variant: "success" });
    } catch (error) {
      console.error("Error saving general config:", error);
      enqueueSnackbar("Gagal menyimpan konfigurasi umum", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Toggle status in confirmedStatuses array
  const toggleConfirmedStatus = (status) => {
    setSafetyConfig((prev) => {
      const currentStatuses = prev.confirmedStatuses || [];
      if (currentStatuses.includes(status)) {
        return {
          ...prev,
          confirmedStatuses: currentStatuses.filter((s) => s !== status),
        };
      } else {
        return {
          ...prev,
          confirmedStatuses: [...currentStatuses, status],
        };
      }
    });
  };

  // Refresh safety config from server
  const refreshSafetyConfig = async () => {
    try {
      setRefreshing(true);
      const refreshConfig = httpsCallable(functions, "refreshSafetyConfig");
      await refreshConfig();
      await loadSafetyConfig();
      enqueueSnackbar("Konfigurasi berhasil di-refresh dari server", { variant: "success" });
    } catch (error) {
      console.error("Error refreshing config:", error);
      enqueueSnackbar("Gagal refresh konfigurasi", { variant: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  // Test connection to Desty API
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus(null);
      const testFn = httpsCallable(functions, "testDestyCredentials");
      const result = await testFn();
      if (result.data?.success) {
        setConnectionStatus({ success: true, message: "Koneksi berhasil!" });
        enqueueSnackbar("Koneksi ke Desty berhasil!", { variant: "success" });
      } else {
        setConnectionStatus({ success: false, message: result.data?.error || "Koneksi gagal" });
        enqueueSnackbar("Koneksi ke Desty gagal!", { variant: "error" });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionStatus({ success: false, message: error.message });
      enqueueSnackbar("Gagal test koneksi: " + error.message, { variant: "error" });
    } finally {
      setTestingConnection(false);
    }
  };

  // Load logs
  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const getPushLogs = httpsCallable(functions, "getStockPushLogs");
      const pushLogsResult = await getPushLogs({ limit: 20 });
      if (pushLogsResult.data?.logs) {
        setPushLogs(pushLogsResult.data.logs);
      }
      const getWebhookLogs = httpsCallable(functions, "getWebhookLogs");
      const webhookLogsResult = await getWebhookLogs({ limit: 20 });
      if (webhookLogsResult.data?.logs) {
        setOrderLogs(webhookLogsResult.data.logs);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
      enqueueSnackbar("Gagal memuat log", { variant: "error" });
    } finally {
      setLoadingLogs(false);
    }
  };

  // Clear Stock Push Logs
  const clearStockPushLogs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus semua Stock Push Logs?")) {
      return;
    }

    try {
      setClearingLogs(true);
      const clearFn = httpsCallable(functions, "clearStockPushLogs");
      const result = await clearFn({});
      if (result.data?.success) {
        enqueueSnackbar(`Berhasil menghapus ${result.data.deletedCount} log push stock`, { variant: "success" });
        setPushLogs([]);
      } else {
        enqueueSnackbar("Gagal menghapus log", { variant: "error" });
      }
    } catch (error) {
      console.error("Error clearing stock push logs:", error);
      enqueueSnackbar("Gagal menghapus log: " + error.message, { variant: "error" });
    } finally {
      setClearingLogs(false);
    }
  };

  // Clear Webhook Logs
  const clearWebhookLogs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus semua Order Webhook Logs?")) {
      return;
    }

    try {
      setClearingLogs(true);
      const clearFn = httpsCallable(functions, "clearWebhookLogs");
      const result = await clearFn({});
      if (result.data?.success) {
        enqueueSnackbar(`Berhasil menghapus ${result.data.deletedCount} log webhook`, { variant: "success" });
        setOrderLogs([]);
      } else {
        enqueueSnackbar("Gagal menghapus log", { variant: "error" });
      }
    } catch (error) {
      console.error("Error clearing webhook logs:", error);
      enqueueSnackbar("Gagal menghapus log: " + error.message, { variant: "error" });
    } finally {
      setClearingLogs(false);
    }
  };

  // Clear All Logs
  const clearAllLogs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA logs (Push & Webhook)?")) {
      return;
    }

    try {
      setClearingLogs(true);
      await clearStockPushLogs();
      await clearWebhookLogs();
      enqueueSnackbar("Semua log berhasil dihapus!", { variant: "success" });
    } catch (error) {
      console.error("Error clearing all logs:", error);
      enqueueSnackbar("Gagal menghapus semua log: " + error.message, { variant: "error" });
    } finally {
      setClearingLogs(false);
    }
  };

  // Load logs when tab is selected
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Memuat konfigurasi...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Pengaturan Desty</h2>
      <p className="text-muted mb-4">
        Kelola pengaturan integrasi Desty untuk sinkronisasi stock dan webhook.
      </p>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            style={{
              backgroundColor: activeTab === "overview" ? "#3D5E54" : "transparent",
              color: activeTab === "overview" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <Database className="me-1" /> Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "safety" ? "active" : ""}`}
            onClick={() => setActiveTab("safety")}
            style={{
              backgroundColor: activeTab === "safety" ? "#3D5E54" : "transparent",
              color: activeTab === "safety" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <Pause className="me-1" /> Safety
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "sync" ? "active" : ""}`}
            onClick={() => setActiveTab("sync")}
            style={{
              backgroundColor: activeTab === "sync" ? "#3D5E54" : "transparent",
              color: activeTab === "sync" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <ArrowCounterclockwise className="me-1" /> Sync
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "webhook" ? "active" : ""}`}
            onClick={() => setActiveTab("webhook")}
            style={{
              backgroundColor: activeTab === "webhook" ? "#3D5E54" : "transparent",
              color: activeTab === "webhook" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <Plug className="me-1" /> Webhook
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "credentials" ? "active" : ""}`}
            onClick={() => setActiveTab("credentials")}
            style={{
              backgroundColor: activeTab === "credentials" ? "#3D5E54" : "transparent",
              color: activeTab === "credentials" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <Gear className="me-1" /> Credentials
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
            style={{
              backgroundColor: activeTab === "logs" ? "#3D5E54" : "transparent",
              color: activeTab === "logs" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <LinkIcon className="me-1" /> Logs
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0"><Plug className="me-2" />Koneksi Desty</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Status Koneksi</h6>
                  {connectionStatus ? (
                    <div className={`alert ${connectionStatus.success ? "alert-success" : "alert-danger"}`}>
                      {connectionStatus.success ? <CheckCircle className="me-2" /> : <XCircle className="me-2" />}
                      {connectionStatus.message}
                    </div>
                  ) : (
                    <p className="text-muted">Klik tombol di bawah untuk test koneksi</p>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={testConnection}
                    disabled={testingConnection}
                    style={{ backgroundColor: "#3D5E54", border: "none" }}
                  >
                    {testingConnection ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Menguji...
                      </>
                    ) : (
                      <>
                        <Plug className="me-2" />Test Koneksi
                      </>
                    )}
                  </button>
                </div>
                <div className="col-md-6">
                  <h6>Webhook URL</h6>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value="https://asia-southeast2-carramica.web.app/destyWebhook"
                      readOnly
                    />
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText("https://asia-southeast2-carramica.web.app/destyWebhook");
                        enqueueSnackbar("URL berhasil disalin!", { variant: "success" });
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <small className="text-muted">
                    Gunakan URL ini di dashboard Desty untuk webhook order
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0"><Gear className="me-2" />Status Konfigurasi Saat Ini</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className={`p-3 rounded text-center ${safetyConfig.stockDeductionEnabled ? "bg-success text-white" : "bg-secondary text-white"}`}>
                    <h4>Stock Deduction</h4>
                    <h3 className="mb-0">{safetyConfig.stockDeductionEnabled ? "ON" : "OFF"}</h3>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className={`p-3 rounded text-center ${safetyConfig.dryRunMode ? "bg-warning text-dark" : "bg-success text-white"}`}>
                    <h4>Dry Run</h4>
                    <h3 className="mb-0">{safetyConfig.dryRunMode ? "ON" : "OFF"}</h3>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className={`p-3 rounded text-center ${safetyConfig.idempotencyEnabled ? "bg-success text-white" : "bg-secondary text-white"}`}>
                    <h4>Idempotency</h4>
                    <h3 className="mb-0">{safetyConfig.idempotencyEnabled ? "ON" : "OFF"}</h3>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className={`p-3 rounded text-center ${syncConfig.pushStockAfterSettlement ? "bg-success text-white" : "bg-secondary text-white"}`}>
                    <h4>Push ke Desty</h4>
                    <h3 className="mb-0">{syncConfig.pushStockAfterSettlement ? "ON" : "OFF"}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0"><Play className="me-2" />Aksi Cepat</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-2">
                  <button
                    className="btn btn-outline-success w-100"
                    onClick={refreshSafetyConfig}
                    disabled={refreshing}
                  >
                    <ArrowCounterclockwise className="me-2" />
                    Refresh Konfigurasi
                  </button>
                </div>
                <div className="col-md-4 mb-2">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => setActiveTab("safety")}
                  >
                    <Pause className="me-2" />
                    Edit Safety Config
                  </button>
                </div>
                <div className="col-md-4 mb-2">
                  <button
                    className="btn btn-outline-info w-100"
                    onClick={() => setActiveTab("logs")}
                  >
                    <LinkIcon className="me-2" />
                    Lihat Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Config Tab */}
      {activeTab === "safety" && (
        <div>
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0"><Pause className="me-2" />Pengaturan Safety</h5>
            </div>
            <div className="card-body">
              {/* Stock Deduction Toggle */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Stock Deduction</h6>
                    <small className="text-muted">
                      Aktifkan untuk auto sync stock saat ada order dari marketplace
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={safetyConfig.stockDeductionEnabled}
                      onChange={(e) =>
                        setSafetyConfig((prev) => ({
                          ...prev,
                          stockDeductionEnabled: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Dry Run Mode Toggle */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Dry Run Mode</h6>
                    <small className="text-muted">
                      Jika aktif, stock akan di-sync tapi TIDAK dikirim ke marketplace
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={safetyConfig.dryRunMode}
                      onChange={(e) =>
                        setSafetyConfig((prev) => ({
                          ...prev,
                          dryRunMode: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Idempotency Toggle */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Idempotency (Cegah Duplikat)</h6>
                    <small className="text-muted">
                      Jika aktif, order yang sudah diproses tidak akan diproses lagi
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={safetyConfig.idempotencyEnabled}
                      onChange={(e) =>
                        setSafetyConfig((prev) => ({
                          ...prev,
                          idempotencyEnabled: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Confirmed Statuses */}
              <div className="mb-3">
                <h6 className="mb-2">Status Order yang Memicu Sync Stock</h6>
                <small className="text-muted mb-3 d-block">
                  Pilih status order yang dianggap sebagai "sudah dibayar" dan akan memicu sync stock
                </small>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      className={`btn ${
                        (safetyConfig.confirmedStatuses || []).includes(status)
                          ? "btn-success"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => toggleConfirmedStatus(status)}
                      style={{ cursor: "pointer" }}
                    >
                      {(safetyConfig.confirmedStatuses || []).includes(status) ? "✓ " : ""}
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <hr />

              {/* Save Button */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={saveSafetyConfig}
                  disabled={saving}
                  style={{ backgroundColor: "#3D5E54", border: "none" }}
                >
                  {saving ? "Menyimpan..." : "💾 Simpan Konfigurasi Safety"}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={refreshSafetyConfig}
                  disabled={refreshing}
                >
                  {refreshing ? "⟳ Memuat..." : "🔄 Refresh dari Server"}
                </button>
              </div>
            </div>
          </div>

          <div className="alert alert-warning">
            <h6>💡 Tips Pengaturan</h6>
            <ul className="mb-0">
              <li>
                <strong>Stock Deduction OFF + Dry Run ON:</strong> Aman, hanya test tanpa perubahan
              </li>
              <li>
                <strong>Stock Deduction ON + Dry Run OFF:</strong> Produksi, stock di-sync
              </li>
              <li>
                <strong>Idempotency:</strong> Selalu aktifkan untuk mencegah order double-process
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Sync Options Tab */}
      {activeTab === "sync" && (
        <div>
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0"><ArrowCounterclockwise className="me-2" />Pengaturan Sync</h5>
            </div>
            <div className="card-body">
              {/* Sync Stock on Webhook */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Sync Stock saat Webhook</h6>
                    <small className="text-muted">
                      Sync onHandStock dari Desty saat ada webhook order
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={syncConfig.syncStockOnWebhook}
                      onChange={(e) =>
                        setSyncConfig((prev) => ({
                          ...prev,
                          syncStockOnWebhook: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Push Stock after Settlement */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Push Stock ke Desty setelah Settlement</h6>
                    <small className="text-muted">
                      Setelah order Midtrans settlement, push stock Carramica ke Desty
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={syncConfig.pushStockAfterSettlement}
                      onChange={(e) =>
                        setSyncConfig((prev) => ({
                          ...prev,
                          pushStockAfterSettlement: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Sync Weight */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Sync Berat Produk</h6>
                    <small className="text-muted">
                      Sync berat produk dari Desty saat sync produk
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={syncConfig.syncWeight}
                      onChange={(e) =>
                        setSyncConfig((prev) => ({
                          ...prev,
                          syncWeight: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Sync Price */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Sync Harga Produk</h6>
                    <small className="text-muted">
                      Sync harga produk dari Desty saat sync produk
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={syncConfig.syncPrice}
                      onChange={(e) =>
                        setSyncConfig((prev) => ({
                          ...prev,
                          syncPrice: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Sync Images */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Sync Gambar Produk</h6>
                    <small className="text-muted">
                      Sync gambar produk dari Desty saat sync produk
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={syncConfig.syncImages}
                      onChange={(e) =>
                        setSyncConfig((prev) => ({
                          ...prev,
                          syncImages: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Sync Only from Gudang Online */}
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Hanya Gudang Online</h6>
                    <small className="text-muted">
                      Hanya sync stock dari Gudang Online, bukan jumlah semua warehouse
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={syncConfig.syncOnlyFromGudangOnline}
                      onChange={(e) =>
                        setSyncConfig((prev) => ({
                          ...prev,
                          syncOnlyFromGudangOnline: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              <button
                className="btn btn-primary"
                onClick={saveSyncConfig}
                disabled={saving}
                style={{ backgroundColor: "#3D5E54", border: "none" }}
              >
                {saving ? "Menyimpan..." : "💾 Simpan Konfigurasi Sync"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Tab */}
      {activeTab === "webhook" && (
        <div>
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0"><Plug className="me-2" />Pengaturan Webhook</h5>
            </div>
            <div className="card-body">
              {/* Webhook Enabled */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Aktifkan Webhook</h6>
                    <small className="text-muted">
                      Terima dan proses webhook dari Desty
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={webhookConfig.enabled}
                      onChange={(e) =>
                        setWebhookConfig((prev) => ({
                          ...prev,
                          enabled: e.target.checked,
                        }))
                      }
                      style={{ width: "50px", height: "25px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Retry Count */}
              <div className="mb-4">
                <h6 className="mb-2">Jumlah Retry</h6>
                <input
                  type="number"
                  className="form-control"
                  value={webhookConfig.retryCount}
                  onChange={(e) =>
                    setWebhookConfig((prev) => ({
                      ...prev,
                      retryCount: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  max="10"
                  style={{ maxWidth: "200px" }}
                />
                <small className="text-muted">
                  Jumlah percobaan ulang jika webhook gagal diproses
                </small>
              </div>

              <hr />

              {/* Retry Delay */}
              <div className="mb-3">
                <h6 className="mb-2">Delay Retry (ms)</h6>
                <input
                  type="number"
                  className="form-control"
                  value={webhookConfig.retryDelayMs}
                  onChange={(e) =>
                    setWebhookConfig((prev) => ({
                      ...prev,
                      retryDelayMs: parseInt(e.target.value) || 1000,
                    }))
                  }
                  min="100"
                  max="10000"
                  step="100"
                  style={{ maxWidth: "200px" }}
                />
                <small className="text-muted">
                  Waktu tunda antar retry dalam milidetik
                </small>
              </div>

              <hr />

              <button
                className="btn btn-primary"
                onClick={saveWebhookConfig}
                disabled={saving}
                style={{ backgroundColor: "#3D5E54", border: "none" }}
              >
                {saving ? "Menyimpan..." : "💾 Simpan Konfigurasi Webhook"}
              </button>
            </div>
          </div>

          {/* Webhook URL Info */}
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Informasi Webhook URL</h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                <strong>Webhook URL:</strong>
              </p>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  value="https://asia-southeast2-carramica.web.app/destyWebhook"
                  readOnly
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText("https://asia-southeast2-carramica.web.app/destyWebhook");
                    enqueueSnackbar("URL berhasil disalin!", { variant: "success" });
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="text-muted mb-0">
                <small>
                  Daftarkan URL ini di dashboard Desty pada bagian Webhook Settings untuk menerima notifikasi order.
                </small>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === "credentials" && (
        <div>
          <div className="card mb-4">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0"><Gear className="me-2" />Konfigurasi Kredensial</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Warehouse ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalConfig.warehouseId || ""}
                  onChange={(e) =>
                    setGeneralConfig((prev) => ({
                      ...prev,
                      warehouseId: e.target.value,
                    }))
                  }
                  placeholder="crm-warehouse"
                />
                <small className="text-muted">
                  ID warehouse external di Desty untuk sinkronisasi stock
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">API Base URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalConfig.apiBase || ""}
                  onChange={(e) =>
                    setGeneralConfig((prev) => ({
                      ...prev,
                      apiBase: e.target.value,
                    }))
                  }
                  placeholder="https://api.desty.app"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Apply ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalConfig.applyId || ""}
                  onChange={(e) =>
                    setGeneralConfig((prev) => ({
                      ...prev,
                      applyId: e.target.value,
                    }))
                  }
                  placeholder="e384d7c6-b5a0-46ef-8165-e7cc4ffbb3fe"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalConfig.username || ""}
                  onChange={(e) =>
                    setGeneralConfig((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="+6281215571500"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mobile</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalConfig.mobile || ""}
                  onChange={(e) =>
                    setGeneralConfig((prev) => ({
                      ...prev,
                      mobile: e.target.value,
                    }))
                  }
                  placeholder="+6281215571500"
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={saveGeneralConfig}
                disabled={saving}
                style={{ backgroundColor: "#3D5E54", border: "none" }}
              >
                {saving ? "Menyimpan..." : "💾 Simpan Kredensial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* logs Tab */}
      {activeTab === "logs" && (
        <div>
          <div className="d-flex justify-content-end mb-3">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={clearAllLogs}
              disabled={clearingLogs || (pushLogs.length === 0 && orderLogs.length === 0)}
            >
              {clearingLogs ? "Menghapus..." : "🗑️ Clear All Logs"}
            </button>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📤 Stock Push Logs ({pushLogs.length})</h5>
              {pushLogs.length > 0 && (
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={clearStockPushLogs}
                  disabled={clearingLogs}
                >
                  {clearingLogs ? "..." : "🗑️ Clear"}
                </button>
              )}
            </div>
            <div className="card-body">
              {loadingLogs ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status"></div>
                  Memuat log...
                </div>
              ) : pushLogs.length === 0 ? (
                <p className="text-muted text-center">Belum ada log push stock</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>SKU</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pushLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatTimestamp(log.timestamp)}</td>
                          <td><code>{log.skuNumber}</code></td>
                          <td>{log.stock}</td>
                          <td>
                            <span className={`badge ${log.status === "success" ? "bg-success" : log.status === "failed" ? "bg-danger" : "bg-warning"}`}>
                              {log.status}
                            </span>
                          </td>
                          <td>{log.method || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📥 Order Webhook Logs ({orderLogs.length})</h5>
              {orderLogs.length > 0 && (
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={clearWebhookLogs}
                  disabled={clearingLogs}
                >
                  {clearingLogs ? "..." : "🗑️ Clear"}
                </button>
              )}
            </div>
            <div className="card-body">
              {loadingLogs ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status"></div>
                  Memuat log...
                </div>
              ) : orderLogs.length === 0 ? (
                <p className="text-muted text-center">Belum ada log webhook</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Order SN</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Stock Sync</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatTimestamp(log.receivedAt)}</td>
                          <td><code>{log.orderSn || "-"}</code></td>
                          <td>
                            <span className={`badge ${log.status === "processing_stock_sync" ? "bg-primary" : log.status === "dry_run" ? "bg-warning" : "bg-secondary"}`}>
                              {log.status || "-"}
                            </span>
                          </td>
                          <td>{log.itemList?.length || 0}</td>
                          <td>
                            {log.stockSynced ? (
                              <span className="badge bg-success">✓ Ya</span>
                            ) : (
                              <span className="badge bg-secondary">✗ Tidak</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestySettings;