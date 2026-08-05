import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { NavDropdown } from "react-bootstrap";
import {
  CaretDownFill,
  CaretRightFill,
  EnvelopeAtFill,
  PersonCircle,
  List,
  XSquareFill,
  XLg,
  BoxArrowRight,
  Gear,
} from "react-bootstrap-icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { auth, firestore } from "../FirebaseFrovider";
import { LogoutDialog } from "./logoutDialog";

// Default menu items - tampil saat data rules belum dimuat
const DEFAULT_MENU = [
  { path: "/", name: "Home" },
  { path: "/add-order", name: "Add Order" },
  { path: "/orders", name: "Orders" },
  { path: "/products", name: "Product" },
  { path: "/logistic", name: "Logistic" },
  { path: "/contacts", name: "Contact" },
  { path: "/report", name: "Report" },
  { path: "/settings", name: "Settings" },
];

const Header = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [checkList, setChcekList] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true); // Track menu loading state
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const handleMouseEnter = (name) => setActiveSubMenu(name);
  const handleMouseLeave = () => setActiveSubMenu(null);
  const handleShowLogoutDialog = () => {
    setShowLogoutDialog(true);
    setShowUserMenu(false);
  };
  const handleLogout = () => auth.signOut();

  const location = useLocation();
  const path = location.pathname;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 fetch user profile
  useEffect(() => {
    async function getUsers() {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser?.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    }
    getUsers();
  }, [currentUser]);

  // 🔹 fetch menu rules
  useEffect(() => {
    const fetchData = async () => {
      if (profile?.rules) {
        setMenuLoading(true);
        const docRef = doc(
          firestore,
          "settings",
          "rules",
          "menu",
          profile.rules
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setChcekList(docSnap.data()?.akses);
        } else {
          console.log("No such document!");
        }
        setMenuLoading(false);
      } else if (profile && Object.keys(profile).length > 0) {
        // If profile exists but no rules, use default menu
        setMenuLoading(false);
      }
    };
    fetchData();
  }, [profile?.rules]);

  const akses = checkList?.map((role) => ({
    path: role?.path,
    name: role?.name,
    subMenu: role?.subMenu || null,
  }));

  // Gunakan menu default jika checkList kosong dan sedang loading
  const displayMenu = !menuLoading && checkList?.length > 0 ? akses : DEFAULT_MENU;

  // 🔹 handle resize to toggle mobile mode
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeLinkStyle = {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "500",
  };

  return (
    <header style={styles.header} className="header">
      <div style={styles.headerContainer}>
        {isMobile && (
          <div
            style={styles.mobileMenuButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <XLg size={26} /> : <List size={26} />}
          </div>
        )}

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          {/* <span style={styles.logoIcon}>C</span> */}
          <span style={styles.logoText}>CARRAMICA</span>
        </Link>

        {/* Navigation links */}
        <div
          style={{
            ...styles.navLinks,
            ...(isMobile
              ? menuOpen
                ? styles.navLinksMobileOpen
                : styles.navLinksMobileClosed
              : {}),
          }}
        >
          {displayMenu?.map((acc) => (
            <div
              key={acc.path}
              onMouseEnter={() => acc.subMenu && handleMouseEnter(acc.name)}
              onMouseLeave={handleMouseLeave}
              style={styles.navItem}
            >
              <Link
                to={acc.path === "/products/*" ? "/products" : acc.path}
                style={
                  (path === "/products" && acc.path === "/products/*") || path === acc.path
                    ? { ...styles.navLink, ...activeLinkStyle }
                    : styles.navLink
                }
                className="nav-link"
              >
                {acc.name}
                {acc.subMenu &&
                  (activeSubMenu === acc.name ? (
                    <CaretDownFill size={14} />
                  ) : (
                    <CaretRightFill size={14} />
                  ))}
              </Link>

              {acc.subMenu && activeSubMenu === acc.name && (
                <div style={styles.submenu}>
                  {acc.subMenu.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path === "/products/*" ? "/products" : sub.path}
                      style={styles.submenuItem}
                      onClick={() => setActiveSubMenu(null)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Menu */}
        <div style={styles.userSection} ref={userMenuRef}>
          <div
            style={{
              ...styles.userButton,
              ...(showUserMenu ? styles.userButtonActive : {}),
            }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div style={styles.userAvatar}>
              <PersonCircle size={22} />
            </div>
            <span style={styles.userName}>
              {profile?.firstName || "User"}
            </span>
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div style={styles.userDropdown}>
              <div style={styles.userDropdownHeader}>
                <div style={styles.userDropdownAvatar}>
                  <PersonCircle size={40} color="#3D5E54" />
                </div>
                <div style={styles.userDropdownInfo}>
                  <strong style={{ fontSize: "14px", color: "#212529" }}>
                    {profile?.firstName} {profile?.lastName}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#6c757d" }}>
                    {profile?.email}
                  </span>
                </div>
              </div>
              <div style={styles.userDropdownDivider} />
              <Link
                to="/settings"
                style={styles.userDropdownItem}
                onClick={() => setShowUserMenu(false)}
              >
                <Gear size={16} />
                <span>Settings</span>
              </Link>
              <div
                style={styles.userDropdownItem}
                onClick={handleShowLogoutDialog}
              >
                <BoxArrowRight size={16} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>

        {/* Logout dialog */}
        <LogoutDialog
          show={showLogoutDialog}
          handleClose={() => setShowLogoutDialog(false)}
          handleLogout={handleLogout}
        />
      </div>
    </header>
  );
};

export default Header;

const styles = {
  header: {
    color: "white",
    zIndex: 1000,
    backgroundColor: "#3D5E54",
    width: "100%",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0px 24px",
  },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: "white",
  },
  logoIcon: {
    backgroundColor: "white",
    color: "#3D5E54",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
  },
  logoText: {
    letterSpacing: "1px",
  },
  navLinks: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  navItem: {
    position: "relative",
  },
  navLink: {
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  submenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#fff",
    border: "1px solid #e9ecef",
    borderRadius: "12px",
    padding: "8px",
    zIndex: 10,
    minWidth: "180px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    marginTop: "4px",
  },
  submenuItem: {
    display: "block",
    padding: "10px 14px",
    color: "#495057",
    textAlign: "left",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "background 0.2s ease",
  },
  userSection: {
    position: "relative",
    marginLeft: "16px",
  },
  userButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s ease",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  userButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
  },
  userDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    minWidth: "260px",
    overflow: "hidden",
    zIndex: 1001,
  },
  userDropdownHeader: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f8f9fa",
  },
  userDropdownAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#e9ecef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userDropdownInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  userDropdownDivider: {
    height: "1px",
    backgroundColor: "#e9ecef",
  },
  userDropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    color: "#495057",
    textDecoration: "none",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  mobileMenuButton: {
    display: "block",
    color: "white",
    cursor: "pointer",
    padding: "8px",
  },
  navLinksMobileClosed: {
    display: "none",
  },
  navLinksMobileOpen: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: "12px",
    gap: "4px",
    paddingBottom: "12px",
  },
};
