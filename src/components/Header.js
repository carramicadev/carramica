import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { NavDropdown } from "react-bootstrap";
import {
  CaretDownFill,
  CaretRightFill,
  EnvelopeAtFill,
  PersonCircle,
  List,
  XSquareFill,
  XLg,
} from "react-bootstrap-icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { auth, firestore } from "../FirebaseFrovider";
import { LogoutDialog } from "./logoutDialog";

const Header = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [checkList, setChcekList] = useState([]);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleMouseEnter = (name) => setActiveSubMenu(name);
  const handleMouseLeave = () => setActiveSubMenu(null);
  const handleShowLogoutDialog = () => setShowLogoutDialog(true);
  const handleLogout = () => auth.signOut();

  const location = useLocation();
  const path = location.pathname;

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
      }
    };
    fetchData();
  }, [profile?.rules]);

  const akses = checkList?.map((role) => ({
    path: role?.path,
    name: role?.name,
    subMenu: role?.subMenu || null,
  }));

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
    backgroundColor: "#00000026",
    padding: "10px",
    borderRadius: "7px",
  };

  return (
    <header style={styles.header} className="header">
      <div style={styles.headerContainer}>
        {isMobile && (
          <div
            style={styles.mobileMenuButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <XLg size={28} /> : <List size={28} />}
          </div>
        )}
        {/* Logo */}
        <div style={styles.logo}>CARRAMICA</div>
        {/* User icon */}
        {isMobile && menuOpen && (
          <div style={styles.userIcon}>
            <NavDropdown
              title={<PersonCircle size={30} />}
              id="basic-nav-dropdown"
            >
              <NavDropdown.ItemText style={{ whiteSpace: "nowrap" }}>
                <PersonCircle size={20} style={{ marginRight: 5 }} />
                {profile?.firstName} {profile?.lastName}
              </NavDropdown.ItemText>
              <NavDropdown.ItemText style={{ whiteSpace: "nowrap" }}>
                <EnvelopeAtFill size={20} style={{ marginRight: 5 }} />
                {profile?.email}
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item
                onClick={handleShowLogoutDialog}
                style={{ color: "red" }}
              >
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </div>
        )}
        {/* Hamburger button for mobile */}

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
          {akses.map((acc) => (
            <div
              key={acc.path}
              onMouseEnter={() => acc.subMenu && handleMouseEnter(acc.name)}
              onMouseLeave={handleMouseLeave}
              style={styles.navItem}
            >
              <Link
                to={acc.path === "/products/*" ? "/products" : acc.path}
                style={
                  path === "/products" && acc.path === "/products/*"
                    ? activeLinkStyle
                    : path === acc.path
                    ? activeLinkStyle
                    : styles.navLink
                }
                className="nav-link"
              >
                {acc.name}
                {acc.subMenu &&
                  (activeSubMenu === acc.name ? (
                    <CaretDownFill />
                  ) : (
                    <CaretRightFill />
                  ))}
              </Link>

              {acc.subMenu && activeSubMenu === acc.name && (
                <div style={styles.submenu}>
                  {acc.subMenu.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path === "/products/*" ? "/products" : sub.path}
                      style={styles.submenuItem}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User icon */}
        {!menuOpen && (
          <div style={styles.userIcon}>
            <NavDropdown
              title={<PersonCircle size={30} />}
              id="basic-nav-dropdown"
            >
              <NavDropdown.ItemText style={{ whiteSpace: "nowrap" }}>
                <PersonCircle size={20} style={{ marginRight: 5 }} />
                {profile?.firstName} {profile?.lastName}
              </NavDropdown.ItemText>
              <NavDropdown.ItemText style={{ whiteSpace: "nowrap" }}>
                <EnvelopeAtFill size={20} style={{ marginRight: 5 }} />
                {profile?.email}
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item
                onClick={handleShowLogoutDialog}
                style={{ color: "red" }}
              >
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </div>
        )}

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
    zIndex: 1,
    backgroundColor: "#3D5E54",
    width: "100%",
    paddingLeft: "10px",
    paddingRight: "10px",
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  navLinks: {
    display: "flex",
    gap: 20,
    alignItems: "center",
  },
  navItem: {
    position: "relative",
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  submenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: 5,
    padding: 5,
    zIndex: 10,
  },
  submenuItem: {
    display: "block",
    padding: "5px 10px",
    color: "#3D5E54",
    textAlign: "left",
    textDecoration: "none",
  },
  userIcon: {
    display: "flex",
    alignItems: "center",
  },
  mobileMenuButton: {
    display: "block",
    color: "white",
    cursor: "pointer",
  },
  navLinksMobileClosed: {
    display: "none",
  },
  navLinksMobileOpen: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: 10,
    gap: 10,
  },
};
