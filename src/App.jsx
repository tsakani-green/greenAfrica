// src/App.jsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import { SimulationProvider } from "./context/SimulationContext";

// ESG Category pages
import EnvironmentalCategory from "./pages/EnvironmentalCategory";
import SocialCategory from "./pages/SocialCategory";
import GovernanceCategory from "./pages/GovernanceCategory";
import Insights from "./pages/Insights";

// Environmental sub-pages
import Energy from "./pages/environment/Energy";
import Carbon from "./pages/environment/Carbon";
import Water from "./pages/environment/Water";
import Waste from "./pages/environment/Waste";
import Coal from "./pages/environment/Coal";

// Governance sub-pages
import CorporateGovernance from "./pages/governance/CorporateGovernance";
import EthicsCompliance from "./pages/governance/EthicsCompliance";
import DataPrivacySecurity from "./pages/governance/DataPrivacySecurity";
import SupplyChainGovernance from "./pages/governance/SupplyChainGovernance";

// Data Import / Operational View
import DataImport from "./pages/DataImport";

import ErrorBoundaryWrapper from "./components/ErrorBoundaryWrapper";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  const handleLogin = (name) => {
    setUsername(name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUsername("");
    setIsAuthenticated(false);
  };

  return (
    <SimulationProvider>
      <Router>
        {isAuthenticated && (
          <Navbar userName={username} onLogout={handleLogout} />
        )}

        <Routes>
          {/* Root / Login */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          {/* Dashboard Overview */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Dashboard />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* ESG AI Insights */}
          <Route
            path="/dashboard/esg"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Insights />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Social main */}
          <Route
            path="/dashboard/social"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Social sub-pages – linked from Social dropdown */}
          <Route
            path="/dashboard/social/supplier"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/social/human-capital"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/social/community"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/social/stakeholder-surveys"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/social/supplier-survey"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/social/csi"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Governance main */}
          <Route
            path="/dashboard/governance"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <GovernanceCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Governance sub-pages (match Navbar governanceLinks) */}
          <Route
            path="/dashboard/governance/corporate"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <CorporateGovernance />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/governance/ethic"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <EthicsCompliance />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/governance/data"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <DataPrivacySecurity />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/governance/supply"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SupplyChainGovernance />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Environmental landing */}
          <Route
            path="/dashboard/environment"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <EnvironmentalCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Environmental sub-pages */}
          {/* IMPORTANT: this now renders EnvironmentalCategory instead of Energy */}
          <Route
            path="/dashboard/environment/energy"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <EnvironmentalCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/environment/carbon"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Carbon />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/environment/water"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Water />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/environment/waste"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Waste />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard/environment/coal"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Coal />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Legacy / simple routes – optional */}
          <Route
            path="/environmental"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <EnvironmentalCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/social"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <SocialCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/governance"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <GovernanceCategory />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/governance/corporate"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <CorporateGovernance />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/governance/carbon"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Carbon />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/governance/energy"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Energy />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/governance/insights"
            element={
              isAuthenticated ? (
                <ErrorBoundaryWrapper>
                  <Insights />
                </ErrorBoundaryWrapper>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </Router>
    </SimulationProvider>
  );
}

export default App;
