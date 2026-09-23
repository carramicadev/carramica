import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useSnackbar } from "notistack";
import { firestore, functions } from "../../FirebaseFrovider";
import {
  ArrowCounterclockwise,
  CheckCircle,
  XCircle,
  Plug,
  Gear,
  Database,
  Link as LinkIcon,
  CloudArrowUp,
  CloudArrowDown,
  Cart3,
  Shield,
  ClockHistory,
  BoxSeam,
  PersonBadge,
  ListCheck,
} from "react-bootstrap-icons";

const AccurateSettings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // OAuth State
  const [oauthState, setOauthState] = useState({
    authorizationUrl: "",
    hasTokens: false,
    connectedAt: null,
    expiresAt: null,
    session: null,
    host: null,
    databaseId: 2828596,
    databaseName: "PT Carramica Kreasi Indonesia",
  });

  // Config State
  const [config, setConfig] = useState({
    syncEnabled: true,
    dryRunMode: true,
    autoSyncStock: true,
    autoSyncOrders: true,
    pushToDestyFromAccurate: true,
    stockSyncIntervalMs: 300000, // 5 minutes
    orderSyncIntervalMs: 300000,
    confirmedStatuses: ["DONE"],
  });

  // Sync Status
  const [syncStatus, setSyncStatus] = useState({
    lastStockSync: null,
    lastOrderSync: null,
    totalProducts: 0,
    syncedProducts: 0,
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("overview");

  // Load all configs on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        await Promise.all([loadTokens(), loadConfig(), loadSyncStatus()]);
      } catch (error) {
        console.error("Error loading configs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Check connection status when window comes into focus (after OAuth popup closes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Window became visible again (e.g., after OAuth popup closed)
        console.log("[ACCURATE] Window visible again, reloading connection status...");
        loadTokens();
      }
    };

    // Also poll periodically for connection status
    const interval = setInterval(() => {
      loadTokens();
    }, 3000); // Check every 3 seconds

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Load OAuth tokens from Firestore
  const loadTokens = async () => {
    try {
      // Simple path: collection "accurate_settings", doc ID "tokens"
      const docRef = doc(firestore, "accurate_settings", "tokens");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setOauthState((prev) => ({
          ...prev,
          hasTokens: true,
          connectedAt: data.connectedAt,
          expiresAt: data.expiresAt,
          session: data.session,
          host: data.host,
          databaseId: data.databaseId,
          databaseName: data.databaseName,
        }));
        setIsConnected(true);
      } else {
        setOauthState((prev) => ({
          ...prev,
          hasTokens: false,
        }));
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  // Load config from Firestore
  const loadConfig = async () => {
    try {
      const docRef = doc(firestore, "accurate_settings/config", "main");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig((prev) => ({ ...prev, ...docSnap.data() }));
      } else {
        // Create default config
        await setDoc(docRef, config);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  // Load sync status
  const loadSyncStatus = async () => {
    try {
      const logsRef = collection(firestore, "accurate_sync_logs");
      const q = logsRef;
      const snapshot = await getDocs(q);

      const logs = [];
      let lastStockSync = null;
      let lastOrderSync = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({ id: doc.id, ...data });

        if (data.type === "stock_sync" && data.timestamp) {
          if (!lastStockSync || data.timestamp > lastStockSync.timestamp) {
            lastStockSync = data;
          }
        }

        if (data.type === "order_sync" && data.timestamp) {
          if (!lastOrderSync || data.timestamp > lastOrderSync.timestamp) {
            lastOrderSync = data;
          }
        }
      });

      // Sort by timestamp descending
      logs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setSyncLogs(logs.slice(0, 50));
      setSyncStatus((prev) => ({
        ...prev,
        lastStockSync: lastStockSync,
        lastOrderSync: lastOrderSync,
      }));
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  };

  // Save config
  const saveConfig = async () => {
    try {
      setSaving(true);
      const docRef = doc(firestore, "accurate_settings/config", "main");
      await setDoc(docRef, config, { merge: true });
      enqueueSnackbar("Konfigurasi berhasil disimpan!", { variant: "success" });
    } catch (error) {
      console.error("Error saving config:", error);
      enqueueSnackbar("Gagal menyimpan konfigurasi", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Test Accurate connection
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus(null);

      const testFn = httpsCallable(functions, "testAccurateConnection");
      const result = await testFn();

      if (result.data?.success) {
        setConnectionStatus({ success: true, message: result.data.message });
        setIsConnected(true);
        await loadTokens();
        enqueueSnackbar("Koneksi ke Accurate berhasil!", { variant: "success" });
      } else {
        setConnectionStatus({ success: false, message: result.data?.message || "Koneksi gagal" });
        enqueueSnackbar("Koneksi ke Accurate gagal!", { variant: "error" });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionStatus({ success: false, message: error.message });
      enqueueSnackbar("Gagal test koneksi: " + error.message, { variant: "error" });
    } finally {
      setTestingConnection(false);
    }
  };

  // Initiate OAuth flow
  const connectToAccurate = async () => {
    try {
      // Call cloud function to get authorization URL
      const getAuthUrlFn = httpsCallable(functions, "getAccurateAuthUrl");
      const result = await getAuthUrlFn();

      if (result.data?.authorizationUrl) {
        // Open OAuth page in new window
        const authWindow = window.open(result.data.authorizationUrl, "_blank", "width=600,height=700");

        if (authWindow) {
          // Poll for callback - check if window is closed
          const pollTimer = setInterval(async () => {
            try {
              if (authWindow.closed) {
                clearInterval(pollTimer);
                console.log("[ACCURATE] OAuth window closed, checking connection status...");
                // Check if connected by reloading tokens
                await loadTokens();
              }
            } catch (error) {
              console.error("Polling error:", error);
            }
          }, 1000);
        } else {
          // Popup blocked - show fallback
          alert("Popup blocked! Please allow popups for this site.");
        }
      } else {
        // Fallback: manually open authorization URL
        const authUrl = result.data?.authorizationUrl || `https://account.accurate.id/oauth/authorize?client_id=54be850d-61c2-40c6-ab61-9ed9b92c5a72&redirect_uri=https://asia-southeast2-carramica-prod.cloudfunctions.net/accurateOAuthCallback&response_type=code`;
        window.open(authUrl, "_blank");
      }
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      enqueueSnackbar("Gagal memulai OAuth: " + error.message, { variant: "error" });
    }
  };

  // Manual refresh connection status
  const refreshConnection = async () => {
    await loadTokens();
    enqueueSnackbar("Status koneksi diperbarui", { variant: "info" });
  };

  // Disconnect from Accurate
  const disconnectFromAccurate = async () => {
    if (!window.confirm("Apakah Anda yakin ingin disconnect dari Accurate? Anda perlu authorize ulang untuk menggunakan integrasi.")) {
      return;
    }

    try {
      const disconnectFn = httpsCallable(functions, "disconnectAccurate");
      await disconnectFn();
      setIsConnected(false);
      setOauthState({
        authorizationUrl: "",
        hasTokens: false,
        connectedAt: null,
        expiresAt: null,
        session: null,
        host: null,
        databaseId: 2828596,
        databaseName: "PT Carramica Kreasi Indonesia",
      });
      enqueueSnackbar("Berhasil disconnect dari Accurate", { variant: "success" });
    } catch (error) {
      console.error("Error disconnecting:", error);
      enqueueSnackbar("Gagal disconnect: " + error.message, { variant: "error" });
    }
  };

  // Sync stock from Accurate
  const syncStockFromAccurate = async () => {
    try {
      setSyncing(true);
      const syncFn = httpsCallable(functions, "syncStockFromAccurate");
      const result = await syncFn({ dryRun: config.dryRunMode });

      if (result.data?.success) {
        enqueueSnackbar(`Stock sync berhasil! Updated: ${result.data.updated}, Processed: ${result.data.processed}`, {
          variant: "success",
        });
        await loadSyncStatus();
      } else {
        enqueueSnackbar("Stock sync gagal: " + result.data?.error, { variant: "error" });
      }
    } catch (error) {
      console.error("Error syncing stock:", error);
      enqueueSnackbar("Gagal sync stock: " + error.message, { variant: "error" });
    } finally {
      setSyncing(false);
    }
  };

  // Sync orders from Accurate
  const syncOrdersFromAccurate = async () => {
    try {
      setSyncing(true);
      const syncFn = httpsCallable(functions, "syncOrdersFromAccurate");
      const result = await syncFn({ dryRun: config.dryRunMode });

      if (result.data?.success) {
        enqueueSnackbar(`Order sync berhasil! Updated: ${result.data.updated}, Processed: ${result.data.processed}`, {
          variant: "success",
        });
        await loadSyncStatus();
      } else {
        enqueueSnackbar("Order sync gagal: " + result.data?.error, { variant: "error" });
      }
    } catch (error) {
      console.error("Error syncing orders:", error);
      enqueueSnackbar("Gagal sync orders: " + error.message, { variant: "error" });
    } finally {
      setSyncing(false);
    }
  };

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

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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
      <h2>Pengaturan Accurate</h2>
      <p className="text-muted mb-4">
        Kelola pengaturan integrasi Accurate sebagai single source of truth untuk stock dan orders.
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
            className={`nav-link ${activeTab === "oauth" ? "active" : ""}`}
            onClick={() => setActiveTab("oauth")}
            style={{
              backgroundColor: activeTab === "oauth" ? "#3D5E54" : "transparent",
              color: activeTab === "oauth" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <Plug className="me-1" /> Koneksi
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
            className={`nav-link ${activeTab === "config" ? "active" : ""}`}
            onClick={() => setActiveTab("config")}
            style={{
              backgroundColor: activeTab === "config" ? "#3D5E54" : "transparent",
              color: activeTab === "config" ? "#fff" : "#3D5E54",
              border: "1px solid #3D5E54",
              cursor: "pointer",
            }}
          >
            <Gear className="me-1" /> Konfigurasi
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
            <ClockHistory className="me-1" /> Logs
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Connection Status Card */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <Plug className="me-2" />
                Status Koneksi Accurate
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className={`alert ${isConnected ? "alert-success" : "alert-warning"}`}>
                    <h5>
                      {isConnected ? (
                        <>
                          <CheckCircle className="me-2" />
                          Terhubung ke Accurate
                        </>
                      ) : (
                        <>
                          <XCircle className="me-2" />
                          Belum Terhubung
                        </>
                      )}
                    </h5>
                    {isConnected && oauthState.databaseName && (
                      <p className="mb-1">
                        <strong>Database:</strong> {oauthState.databaseName}
                      </p>
                    )}
                    {isConnected && oauthState.host && (
                      <p className="mb-1">
                        <strong>API Host:</strong> {oauthState.host}
                      </p>
                    )}
                    {isConnected && oauthState.connectedAt && (
                      <p className="mb-0">
                        <strong>Terhubung sejak:</strong> {formatTimestamp(oauthState.connectedAt)}
                      </p>
                    )}
                  </div>

                  {isConnected ? (
                    <button
                      className="btn btn-danger"
                      onClick={disconnectFromAccurate}
                      style={{ border: "none" }}
                    >
                      <XCircle className="me-2" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={connectToAccurate}
                      style={{ backgroundColor: "#3D5E54", border: "none" }}
                    >
                      <Plug className="me-2" />
                      Connect ke Accurate
                    </button>
                  )}
                </div>

                <div className="col-md-6">
                  <h6>Test Koneksi</h6>
                  <div className="d-flex gap-2 mb-2">
                    <button
                      className="btn btn-outline-primary"
                      onClick={refreshConnection}
                      style={{ border: "1px solid #3D5E54", color: "#3D5E54" }}
                    >
                      <ArrowCounterclockwise className="me-2" />
                      Refresh Status
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={testConnection}
                      disabled={!isConnected || testingConnection}
                      style={{ border: "1px solid #3D5E54", color: "#3D5E54" }}
                    >
                      {testingConnection ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Menguji...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="me-2" />
                          Test Koneksi API
                        </>
                      )}
                    </button>
                  </div>
                  <small className="text-muted">
                    Klik "Refresh Status" setelah menghubungkan Accurate untuk memperbarui status koneksi.
                  </small>

                  {connectionStatus && (
                    <div className={`alert mt-3 ${connectionStatus.success ? "alert-success" : "alert-danger"}`}>
                      {connectionStatus.success ? <CheckCircle className="me-2" /> : <XCircle className="me-2" />}
                      {connectionStatus.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Status Card */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <ArrowCounterclockwise className="me-2" />
                Status Sinkronisasi
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <BoxSeam size={24} className="me-3 text-primary" />
                    <div>
                      <h6 className="mb-1">Stock Sync</h6>
                      <p className="text-muted mb-0">
                        {syncStatus.lastStockSync
                          ? `Terakhir: ${formatTimestamp(syncStatus.lastStockSync.timestamp)}`
                          : "Belum pernah sync"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <Cart3 size={24} className="me-3 text-primary" />
                    <div>
                      <h6 className="mb-1">Order Sync</h6>
                      <p className="text-muted mb-0">
                        {syncStatus.lastOrderSync
                          ? `Terakhir: ${formatTimestamp(syncStatus.lastOrderSync.timestamp)}`
                          : "Belum pernah sync"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {config.dryRunMode && (
                <div className="alert alert-warning">
                  <Shield className="me-2" />
                  <strong>DRY RUN MODE AKTIF</strong> - Tidak ada data yang akan di-update
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <ListCheck className="me-2" />
                Aksi Cepat
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-primary w-100"
                    onClick={syncStockFromAccurate}
                    disabled={!isConnected || syncing}
                    style={{ backgroundColor: "#3D5E54", border: "none" }}
                  >
                    {syncing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CloudArrowDown className="me-2" />
                        Sync Stock dari Accurate
                      </>
                    )}
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-primary w-100"
                    onClick={syncOrdersFromAccurate}
                    disabled={!isConnected || syncing}
                    style={{ backgroundColor: "#3D5E54", border: "none" }}
                  >
                    {syncing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CloudArrowUp className="me-2" />
                        Sync Orders ke Accurate
                      </>
                    )}
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setActiveTab("logs")}
                  >
                    <ClockHistory className="me-2" />
                    Lihat Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OAuth Connection Tab */}
      {activeTab === "oauth" && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <Plug className="me-2" />
              Koneksi OAuth Accurate
            </h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              <h6>Cara Menghubungkan Accurate:</h6>
              <ol className="mb-0">
                <li>Klik tombol "Connect ke Accurate" di bawah</li>
                <li>Anda akan diarahkan ke halaman login Accurate</li>
                <li>Login dan approve akses untuk Carramica</li>
                <li>Setelah berhasil, Anda akan otomatis kembali</li>
              </ol>
            </div>

            <div className="row">
              <div className="col-md-6">
                <h6>OAuth Configuration</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Client ID:</strong></td>
                      <td><code>54be850d-61c2-40c6-ab61-9ed9b92c5a72</code></td>
                    </tr>
                    <tr>
                      <td><strong>Callback URL:</strong></td>
                      <td><code>https://asia-southeast2-carramica-prod.cloudfunctions.net/accurateOAuthCallback</code></td>
                    </tr>
                    <tr>
                      <td><strong>Database ID:</strong></td>
                      <td><code>2828596</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="col-md-6">
                <h6>Token Status</h6>
                {isConnected ? (
                  <div className="alert alert-success">
                    <CheckCircle className="me-2" />
                    Token aktif dan valid
                    <br />
                    <small>
                      Terhubung: {formatTimestamp(oauthState.connectedAt)}
                      {oauthState.host && (
                        <>
                          <br />
                          Host: {oauthState.host}
                        </>
                      )}
                    </small>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <XCircle className="me-2" />
                    Token tidak ditemukan
                    <br />
                    <small>Klik Connect untuk authorize ulang</small>
                  </div>
                )}

                <button
                  className={`btn ${isConnected ? "btn-danger" : "btn-success"} w-100`}
                  onClick={isConnected ? disconnectFromAccurate : connectToAccurate}
                  style={isConnected ? {} : { backgroundColor: "#3D5E54", border: "none" }}
                >
                  {isConnected ? (
                    <>
                      <XCircle className="me-2" />
                      Disconnect Accurate
                    </>
                  ) : (
                    <>
                      <Plug className="me-2" />
                      Connect ke Accurate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Tab */}
      {activeTab === "sync" && (
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <CloudArrowDown className="me-2" />
                  Sinkronisasi Stock
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Ambil data stock dari Accurate dan update ke Firestore.
                  Stok yang digunakan adalah <code>availableToSell</code> dari Accurate.
                </p>

                <div className="alert alert-info">
                  <strong>Flow:</strong>
                  <br />
                  Accurate.availableToSell → Firestore.product.stok → Desty (push)
                </div>

                <button
                  className="btn btn-primary w-100"
                  onClick={syncStockFromAccurate}
                  disabled={!isConnected || syncing}
                  style={{ backgroundColor: "#3D5E54", border: "none" }}
                >
                  {syncing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Syncing Stock...
                    </>
                  ) : (
                    <>
                      <ArrowCounterclockwise className="me-2" />
                      Sync Stock Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <CloudArrowUp className="me-2" />
                  Sinkronisasi Orders
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Ambil orders dari Accurate dan simpan ke Firestore.
                  Orders dari marketplace (Desty) juga akan di-sync.
                </p>

                <div className="alert alert-info">
                  <strong>Flow:</strong>
                  <br />
                  Website Order → Accurate (create) → Accurate.availableToSell (auto-reduce)
                </div>

                <button
                  className="btn btn-primary w-100"
                  onClick={syncOrdersFromAccurate}
                  disabled={!isConnected || syncing}
                  style={{ backgroundColor: "#3D5E54", border: "none" }}
                >
                  {syncing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Syncing Orders...
                    </>
                  ) : (
                    <>
                      <ArrowCounterclockwise className="me-2" />
                      Sync Orders Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <Gear className="me-2" />
              Konfigurasi Accurate
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Safety Settings</h6>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="dryRunMode"
                    checked={config.dryRunMode}
                    onChange={(e) => setConfig({ ...config, dryRunMode: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="dryRunMode">
                    <strong>Dry Run Mode</strong>
                    <br />
                    <small className="text-muted">
                      Jika aktif, tidak ada data yang akan di-update
                    </small>
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="syncEnabled"
                    checked={config.syncEnabled}
                    onChange={(e) => setConfig({ ...config, syncEnabled: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="syncEnabled">
                    <strong>Sync Enabled</strong>
                    <br />
                    <small className="text-muted">
                      Aktifkan/nonaktifkan semua sinkronisasi
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <h6>Auto Sync Settings</h6>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoSyncStock"
                    checked={config.autoSyncStock}
                    onChange={(e) => setConfig({ ...config, autoSyncStock: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="autoSyncStock">
                    <strong>Auto Sync Stock</strong>
                    <br />
                    <small className="text-muted">
                      Sinkronisasi stock otomatis setiap 5 menit
                    </small>
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="pushToDestyFromAccurate"
                    checked={config.pushToDestyFromAccurate}
                    onChange={(e) => setConfig({ ...config, pushToDestyFromAccurate: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="pushToDestyFromAccurate">
                    <strong>Push ke Desty dari Accurate</strong>
                    <br />
                    <small className="text-muted">
                      Push stock Accurate ke Desty setelah sync
                    </small>
                  </label>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <strong>Stock Sync Interval</strong>
                  </label>
                  <select
                    className="form-select"
                    value={config.stockSyncIntervalMs}
                    onChange={(e) => setConfig({ ...config, stockSyncIntervalMs: parseInt(e.target.value) })}
                  >
                    <option value={60000}>1 menit</option>
                    <option value={300000}>5 menit</option>
                    <option value={600000}>10 menit</option>
                    <option value={1800000}>30 menit</option>
                  </select>
                </div>
              </div>
            </div>

            <hr />

            <button
              className="btn btn-success"
              onClick={saveConfig}
              disabled={saving}
              style={{ backgroundColor: "#3D5E54", border: "none" }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="me-2" />
                  Simpan Konfigurasi
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <ClockHistory className="me-2" />
              Accurate Sync Logs
            </h5>
          </div>
          <div className="card-body">
            <button
              className="btn btn-outline-secondary mb-3"
              onClick={loadSyncStatus}
            >
              <ArrowCounterclockwise className="me-2" />
              Refresh Logs
            </button>

            {syncLogs.length === 0 ? (
              <div className="alert alert-info">
                Belum ada log sinkronisasi Accurate.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Type</th>
                      <th>Operation</th>
                      <th>Status</th>
                      <th>Details</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatTimestamp(log.timestamp)}</td>
                        <td>
                          <span
                            className={`badge ${
                              log.type === "stock_sync"
                                ? "bg-primary"
                                : log.type === "order_sync"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td>{log.operation}</td>
                        <td>
                          {log.success !== false ? (
                            <span className="badge bg-success">Success</span>
                          ) : (
                            <span className="badge bg-danger">Failed</span>
                          )}
                        </td>
                        <td>
                          {log.processed !== undefined && <span>Processed: {log.processed}</span>}
                          {log.updated !== undefined && <span>Updated: {log.updated}</span>}
                          {log.skipped !== undefined && <span>Skipped: {log.skipped}</span>}
                          {log.errors !== undefined && <span>Errors: {log.errors}</span>}
                          {log.error && <span className="text-danger">{log.error}</span>}
                        </td>
                        <td>{formatDuration(log.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccurateSettings;
