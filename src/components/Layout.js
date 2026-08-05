import React from "react";
import Header from "./Header";
import Loading from "./Loading";

/**
 * Layout Component
 * Membungkus setiap halaman dengan Header yang persisten.
 * Header tidak akan hilang saat navigasi antar halaman.
 */
const Layout = ({ children, loading = false }) => {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header selalu render dan persisten */}
      <Header />

      {/* Konten halaman */}
      <div
        className="page-content"
        style={{
          paddingTop: "120px",
          paddingBottom: "50px",
          minHeight: "calc(100vh - 130px)"
        }}
      >
        {loading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh"
          }}>
            <Loading />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Layout;
