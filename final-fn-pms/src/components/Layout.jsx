// Author: Gururaj
// Created: 23rd May 2025
// Description: Main layout for inner app(once login ), which wraps sidebar and topbar.
// Version: 1.0.0
// components/Layout.jsx
// Modified:

import { Outlet, useNavigation } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../pages/global/Sidebar";
import Topbar from "../pages/global/Topbar";
import LoadingFallbackLayout from "./skeleton/LoadingFallbackLayout";

export function LayoutWrapper({ children }) {
  const [isSidebar, setIsSidebar] = useState(true);
  return (
    <>
      <div className="app">
        <Sidebar isSidebar={isSidebar} />
        <main className="content">
          <Topbar setIsSidebar={setIsSidebar} />
          {children}
        </main>
      </div>
    </>
  );
}

export default function Layout() {
  const navigation = useNavigation();


  return (
    <>
      <LayoutWrapper>
        {navigation.state === "loading" ? <LoadingFallbackLayout /> :<Outlet />}
      </LayoutWrapper>
    </>
  );
}
