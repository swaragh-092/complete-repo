// Author: Gururaj
// Created: 23rd May 2025
// Description: Main layout for inner app(once login ), which wraps sidebar and topbar.
// Version: 1.0.0
// components/Layout.jsx
// Modified:

import { Outlet, useNavigation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from "../pages/global/Sidebar";
import Topbar from "../pages/global/Topbar";
import LoadingFallbackLayout from "./skeleton/LoadingFallbackLayout";
import { useOrganization } from "../context/OrganizationContext";

export function LayoutWrapper({ children }) {
  const [isSidebar, setIsSidebar] = useState(true);
  const { currentOrganization, loading } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentOrganization) {
      navigate("/select-organization", { replace: true });
    }
  }, [loading, currentOrganization, navigate]);

  const hasOrg = !!currentOrganization;

  return (
    <div className="app">
      {hasOrg && <Sidebar isSidebar={isSidebar} />}
      <main className="content">
        <Topbar setIsSidebar={setIsSidebar} />
        {hasOrg ? children : null}
      </main>
    </div>
  );
}

export default function Layout() {
  const navigation = useNavigation();

  return (
    <LayoutWrapper>
      {navigation.state === "loading" ? <LoadingFallbackLayout /> : <Outlet />}
    </LayoutWrapper>
  );
}
