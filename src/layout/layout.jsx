import React, { memo, useState, useRef, useCallback } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import "./layout.css";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaRegCircleUser } from "react-icons/fa6";
import { BsCart3 } from "react-icons/bs";
import { CloseModal } from "../utils/closemodal";
import { apiSlice } from "../context/service/api.service";
import { useDispatch } from "react-redux";
import { RiAdminLine } from "react-icons/ri";
import { Button } from "antd";
import Usd from "../components/USD/Usd";

export const Layout = memo(() => {
  const admin = JSON.parse(localStorage.getItem("admin") || "null");
  const role = localStorage.getItem("role");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(role !== "seller");
  const menuRef = useRef(null);

  const toggleMenu = useCallback(() => setMenu((prev) => !prev), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  const logout = useCallback(() => {
    localStorage.clear();
    dispatch(apiSlice.util.resetApiState());
    window.location.reload();
  }, [dispatch, navigate]);

  CloseModal({ modalRef: menuRef, onClose: () => setMenu(false) });

  return (
    <main className="main"
      style={{ background:"#1a2a6b"}}
    >
      {role === "admin" ? (
        <header className={`header ${!sidebarOpen ? "headerOpen" : ""}`}>
          <Usd />

          {/* <Button onClick={toggleSidebar} className="toggle-sidebar-btn">
          </Button> */}

          <div className="header__user" ref={menuRef}>
            <span>{admin?.fullname}</span>
            <button onClick={toggleMenu}>
              <FaRegCircleUser
              />
            </button>

            <div className={`header__user-info ${menu ? "active" : ""}`}>
              <ol>
                <li onClick={toggleMenu}>
                  <Link to="#">Admin shaxsiy kabineti</Link>
                </li>
                <li>
                  <p>
                    <span>rol: </span>
                    <span>{role}</span>
                  </p>
                </li>
                <li>
                  <button onClick={logout}>Chiqish </button>
                </li>
              </ol>
            </div>
          </div>
        </header>
      ) : (
        <header className="header-saller">
          <Usd />
          <div
            style={{ width:"120px",display: "flex", alignItems: "center", color: "white" ,}}
          >
           Sotuv bo'limi{" "}
            <h2
              style={{ color: "#000000", marginTop: "12px", marginLeft: "2px" }}
            >
              {" "}
              {admin?.kassaNumber}
            </h2>
          </div>
          <div className="header__user" ref={menuRef}>
            <span style={{ marginTop: "3px" }}>{admin?.fullname}</span>

            <button onClick={toggleMenu}>
              <FaRegCircleUser />
            </button>

            <div className={`header__user-info ${menu ? "active" : ""}`}>
              <ol>
                <li onClick={toggleMenu}>
                  <Link to="/profile">User shaxsiy kabineti</Link>
                </li>
                <li>
                  <p>
                    <span>Rol: </span>
                    <span>{role === "user" ? "admin" : role}</span>
                  </p>
                </li>
                <li>
                  <button onClick={logout}>Chiqish</button>
                </li>
              </ol>
            </div>
          </div>
        </header>
      )}

      <section className="section">
        <Outlet />
      </section>
    </main>
  );
});
