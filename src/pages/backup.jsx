import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGlobeAfrica,
  FaFileAlt,
  FaShieldAlt,
  FaRobot,
  FaUsers,
  FaBalanceScaleLeft,
  FaExclamationTriangle,
  FaCloud,
  FaTint,
  FaTrash,
  FaIndustry,
  FaFilePdf,
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import { API_BASE_URL } from "../config/api";
import { SimulationContext } from "../context/SimulationContext";
import {
  getLastSixInvoices,
  computeInvoiceEnergyAndCarbon,
} from "../utils/invoices";
import africaEsgLogo from "../assets/AfricaESG.AI.png";

export default function Dashboard() {
  const navigate = useNavigate();

  // Pull simulation data (same used by EnvironmentalCategory)
  const simulation = useContext(SimulationContext);
  const environmentalMetrics = simulation?.environmentalMetrics;

  // --- ESG Summary (strings for UI) ---
  const [esgSummary, setEsGSummary] = useState({
    environmental: "Energy: -- kWh · Renewables: --% · Carbon: -- tCO₂e",
    social:
      "Supplier diversity: --% · Customer satisfaction: --% · Human capital: --%",
    governance: "Corporate governance: -- · ISO 9001: -- · Ethics: --",
  });

  // Structured summary for easier programmatic use
  const [summaryData, setSummaryData] = useState({
    environmental: {},
    social: {},
    governance: {},
  });

  // --- KPI States (financial / carbon) ---
  const [carbonTax, setCarbonTax] = useState(0);
  const [prevCarbonTax, setPrevCarbonTax] = useState(null);

  const [taxAllowances, setTaxAllowances] = useState(0);
  const [prevTaxAllowances, setPrevTaxAllowances] = useState(null);

  const [carbonCredits, setCarbonCredits] = useState(0);
  const [prevCarbonCredits, setPrevCarbonCredits] = useState(null);

  const [energySavings, setEnergySavings] = useState(0);
  const [prevEnergySavings, setPrevEnergySavings] = useState(null);

  // Combined AI insights (for PDF download)
  const [aiInsights, setAIInsights] = useState([]);

  // AI mini report (overall ESG)
  const [miniReport, setMiniReport] = useState({
    baseline: "",
    benchmark: "",
    performance_vs_benchmark: "",
    ai_recommendations: [],
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Live pillar AI (E / S / G)
  const [pillarAiLoading, setPillarAiLoading] = useState(false);
  const [pillarAiError, setPillarAiError] = useState(null);

  // --- Red flags ---
  const [redFlags, setRedFlags] = useState([]);

  // Platform KPI stats (headline cards)
  const [platformStats, setPlatformStats] = useState({
    countries_supported: 50,
    esg_reports_generated: 10000,
    compliance_accuracy: 0.99,
    ai_support_mode: "24/7",
  });

  // Invoice summaries for dashboard-level energy/carbon baseline
  const [invoiceSummaries, setInvoiceSummaries] = useState([]);

  // ---------- Trend indicator ----------
  const renderIndicator = (current, previous) => {
    if (previous === null || previous === undefined) {
      return <div className="h-5" />;
    }

    const diff = current - previous;

    let pctChange =
      previous === 0
        ? current === 0
          ? 0
          : 100
        : (diff / previous) * 100;

    const formatted =
      (diff > 0 ? "+" : "") + pctChange.toFixed(1) + "%";

    const isUp = diff > 0;
    const isDown = diff < 0;

    const color = isUp
      ? "text-emerald-600"
      : isDown
      ? "text-red-600"
      : "text-gray-500";

    return (
      <div
        className={
          "flex items-center gap-1 text-[11px] font-semibold " +
          color +
          " h-5"
        }
      >
        {isUp && (
          <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
            <path
              d="M4 16 L12 8 L20 16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isDown && (
          <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
            <path
              d="M4 8 L12 16 L20 8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {!isUp && !isDown && (
          <svg width="12" height="12" className="opacity-40 shrink-0">
            <circle cx="6" cy="6" r="3" fill="currentColor" />
          </svg>
        )}
        <span className="leading-none">{formatted}</span>
      </div>
    );
  };

  // ---------- Red flag rules ----------
  const computeRedFlags = (summary, metrics) => {
    const flags = [];

    const env = summary?.environmental ?? {};
    const soc = summary?.social ?? {};
    const gov = summary?.governance ?? {};

    const renewableShare =
      env.renewableEnergyShare !== undefined
        ? env.renewableEnergyShare
        : null;
    if (renewableShare !== null && renewableShare < 20) {
      flags.push(
        "Renewable energy share is only " +
          renewableShare +
          "%. This is below the 20% threshold."
      );
    }

    const carbonTaxValue = metrics?.carbonTax ?? 0;
    if (carbonTaxValue > 20000000) {
      flags.push(
        "Carbon tax exposure (R " +
          carbonTaxValue.toLocaleString() +
          ") is above the defined risk threshold."
      );
    }

    const energySavingsValue = metrics?.energySavings ?? 0;
    const totalEnergy = env.totalEnergyConsumption ?? 0;
    if (totalEnergy > 0) {
      const savingsPct = (energySavingsValue / totalEnergy) * 100;
      if (savingsPct < 5) {
        flags.push(
          "Energy savings represent only " +
            savingsPct.toFixed(1) +
            "% of total energy use – consider additional efficiency projects."
        );
      }
    }

    if (
      soc.supplierDiversity !== undefined &&
      soc.supplierDiversity < 5
    ) {
      flags.push(
        "Supplier diversity (" +
          soc.supplierDiversity +
          "%) is low – this may create concentration and social risk."
      );
    }

    if (gov.totalComplianceFindings && gov.totalComplianceFindings > 0) {
      flags.push(
        "There are " +
          gov.totalComplianceFindings +
          " open compliance findings – review governance actions."
      );
    }

    return flags;
  };

  // ---------- Apply snapshot from backend ----------
  const applySnapshotFromBackend = (esgData) => {
    const mock = esgData?.mockData || {};
    const summary = mock.summary || {};
    const metrics = mock.metrics || {};

    const envSummary = summary.environmental || {};
    const socSummary = summary.social || {};
    const govSummary = summary.governance || {};

    // keep structured
    setSummaryData(summary);

    // string-based summary (we'll override Environmental at render with invoice-aware values)
    setEsGSummary({
      environmental:
        "Energy: " +
        (envSummary.totalEnergyConsumption ?? 0) +
        " kWh · Renewables: " +
        (envSummary.renewableEnergyShare ?? "--") +
        "% · Carbon: " +
        (envSummary.carbonEmissions ?? 0).toLocaleString() +
        " tCO₂e",
      social:
        "Supplier diversity: " +
        (socSummary.supplierDiversity ?? "--") +
        "% · Customer satisfaction: " +
        (socSummary.customerSatisfaction ?? "--") +
        "% · Human capital: " +
        (socSummary.humanCapital ?? "--") +
        "%",
      governance:
        "Corporate governance: " +
        (govSummary.corporateGovernance ?? "--") +
        " · ISO 9001: " +
        (govSummary.iso9001Compliance ?? "--") +
        " · Ethics: " +
        (govSummary.businessEthics ?? "--"),
    });

    // previous vs current for trend badges
    setPrevCarbonTax(carbonTax);
    setPrevTaxAllowances(taxAllowances);
    setPrevCarbonCredits(carbonCredits);
    setPrevEnergySavings(energySavings);

    setCarbonTax(metrics.carbonTax || 0);
    setTaxAllowances(metrics.taxAllowances || 0);
    setCarbonCredits(metrics.carbonCredits || 0);
    setEnergySavings(metrics.energySavings || 0);

    setRedFlags(computeRedFlags(summary, metrics));

    const combinedList = esgData?.insights || [];
    setAIInsights(combinedList);
  };

  // ---------- Load snapshot from backend ----------
  const loadSnapshotFromBackend = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const [esgRes, miniRes] = await Promise.all([
        fetch(API_BASE_URL + "/api/esg-data"),
        fetch(API_BASE_URL + "/api/esg-mini-report"),
      ]);

      if (!esgRes.ok) {
        const text = await esgRes.text();
        throw new Error("/api/esg-data error: " + esgRes.status + " " + text);
      }
      if (!miniRes.ok) {
        const text = await miniRes.text();
        throw new Error(
          "/api/esg-mini-report error: " + miniRes.status + " " + text
        );
      }

      const [esgData, miniData] = await Promise.all([
        esgRes.json(),
        miniRes.json(),
      ]);

      applySnapshotFromBackend(esgData);
      setMiniReport({
        baseline: miniData.baseline || "",
        benchmark: miniData.benchmark || "",
        performance_vs_benchmark:
          miniData.performance_vs_benchmark || "",
        ai_recommendations: miniData.ai_recommendations || [],
      });
    } catch (err) {
      console.error("Error loading ESG snapshot from backend:", err);
      setAiError(
        err.message ||
          "Failed to load ESG metrics and AI insights snapshot."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ---- initial load: ESG snapshot ----
  useEffect(() => {
    loadSnapshotFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- live pillar AI (Environmental / Social / Governance) ----
  useEffect(() => {
    const loadPillarAI = async () => {
      setPillarAiLoading(true);
      setPillarAiError(null);

      try {
        const [envRes, socRes, govRes] = await Promise.all([
          fetch(API_BASE_URL + "/api/environmental-insights"),
          fetch(API_BASE_URL + "/api/social-insights"),
          fetch(API_BASE_URL + "/api/governance-insights"),
        ]);

        const responses = [envRes, socRes, govRes];
        const bad = responses.find((r) => !r.ok);
        if (bad) {
          const txt = await bad.text();
          throw new Error(bad.url + " error: " + bad.status + " " + txt);
        }

        const [envData, socData, govData] = await Promise.all(
          responses.map((r) => r.json())
        );

        const combined = []
          .concat(envData.insights || [])
          .concat(socData.insights || [])
          .concat(govData.insights || []);

        if (combined.length > 0) {
          // Override snapshot insights with fresher pillar-based AI
          setAIInsights(combined);
        }
      } catch (err) {
        console.error("Pillar AI insights error:", err);
        setPillarAiError(
          err.message ||
            "Failed to load live ESG AI insights across Environmental, Social and Governance pillars."
        );
      } finally {
        setPillarAiLoading(false);
      }
    };

    loadPillarAI();
  }, []);

  // Load platform headline stats
  useEffect(() => {
    const loadPlatformStats = async () => {
      try {
        const res = await fetch(API_BASE_URL + "/platform/overview");
        if (!res.ok) return;
        const data = await res.json();
        setPlatformStats((prev) => ({
          ...prev,
          ...data,
        }));
      } catch (e) {
        console.warn("Failed to load platform stats", e);
      }
    };

    loadPlatformStats();
  }, []);

  // Load invoices for baseline energy & carbon (uses uploaded invoices)
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        // Use last 6 months of invoices from backend
        const res = await fetch(
          API_BASE_URL + "/api/invoices?last_months=6"
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setInvoiceSummaries(data);
        }
      } catch (e) {
        console.warn("Failed to load invoice summaries for dashboard", e);
      }
    };

    loadInvoices();
  }, []);

  // Last 6 invoices & aggregated energy/carbon (from uploaded invoices)
  const lastSixInvoices = useMemo(
    () => getLastSixInvoices(invoiceSummaries),
    [invoiceSummaries]
  );

  const {
    totalEnergyKwh: invoiceEnergyKWh,
    totalCarbonTonnes: invoiceCarbonTonnes,
  } = useMemo(
    () => computeInvoiceEnergyAndCarbon(lastSixInvoices),
    [lastSixInvoices]
  );

  // ---- TOTAL ENERGY (kWh) FOR DASHBOARD CARD ----
  const dashboardEnergyKWh = useMemo(() => {
    // 1) FIRST CHOICE: invoice-derived energy (from uploaded invoices)
    if (invoiceEnergyKWh != null) return invoiceEnergyKWh;

    // 2) SECOND: raw uploaded ESG rows from SimulationContext
    if (environmentalMetrics) {
      if (
        Array.isArray(environmentalMetrics.uploadedRows) &&
        environmentalMetrics.uploadedRows.length > 0
      ) {
        const rows = environmentalMetrics.uploadedRows;
        const sample = rows[0] || {};
        const candidateCols = ["Electricity (kWh)", "Energy (kWh)"];
        const colName =
          candidateCols.find((c) =>
            Object.prototype.hasOwnProperty.call(sample, c)
          ) || null;

        if (colName) {
          let total = 0;
          rows.forEach((row) => {
            const v = row[colName];
            if (v == null) return;
            const num =
              typeof v === "number"
                ? v
                : parseFloat(String(v).replace(/,/g, ""));
            if (!Number.isNaN(num)) total += num;
          });
          return total;
        }
      }

      // 3) THIRD: sum of energyUsage array from metrics
      if (Array.isArray(environmentalMetrics.energyUsage)) {
        return environmentalMetrics.energyUsage.reduce((sum, v) => {
          const num = Number(v);
          return sum + (Number.isNaN(num) ? 0 : num);
        }, 0);
      }
    }

    // 4) LAST RESORT: summary totalEnergyConsumption (already invoice-aware via backend)
    const env = summaryData.environmental || {};
    if (env.totalEnergyConsumption != null)
      return env.totalEnergyConsumption;

    return null;
  }, [invoiceEnergyKWh, environmentalMetrics, summaryData]);

  // ---- TOTAL CARBON (tCO₂e) FOR DASHBOARD CARD ----
  const dashboardCarbonTonnes = useMemo(() => {
    // 1) invoice-derived CO2 baseline from uploaded invoices
    if (invoiceCarbonTonnes != null) return invoiceCarbonTonnes;

    // 2) fallback to summary (which itself prefers invoices if present)
    const env = summaryData.environmental || {};
    if (env.carbonEmissions != null) return env.carbonEmissions;

    return null;
  }, [invoiceCarbonTonnes, summaryData]);

  // ---- ESG Environmental summary text for PDF & UI ----
  const envSummaryData = summaryData.environmental || {};
  const socSummaryData = summaryData.social || {};
  const govSummaryData = summaryData.governance || {};

  const environmentalSummaryText = useMemo(() => {
    const energyText =
      dashboardEnergyKWh != null
        ? dashboardEnergyKWh.toLocaleString() + " kWh"
        : "-- kWh";
    const renewablesText =
      envSummaryData.renewableEnergyShare != null
        ? envSummaryData.renewableEnergyShare + "%"
        : "--%";
    const carbonText =
      dashboardCarbonTonnes != null
        ? dashboardCarbonTonnes.toLocaleString() + " tCO₂e"
        : "-- tCO₂e";

    return (
      "Energy: " +
      energyText +
      " · Renewables: " +
      renewablesText +
      " · Carbon: " +
      carbonText
    );
  }, [dashboardEnergyKWh, dashboardCarbonTonnes, envSummaryData]);

  // ---- Download ESG Report (PDF) ----
  const handleGenerateReport = () => {
    const doc = new jsPDF();

    const buildPdfBody = (startY) => {
      let y = startY;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("AfricaESG.AI Overview Report", 14, y);

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(
        "Generated: " + new Date().toLocaleDateString(),
        14,
        y
      );

      // Build ESG summary text for PDF – environmental uses invoice data if available
      const envEnergyText =
        dashboardEnergyKWh != null
          ? dashboardEnergyKWh.toLocaleString() + " kWh"
          : "-- kWh";
      const envRenewablesText =
        envSummaryData.renewableEnergyShare != null
          ? envSummaryData.renewableEnergyShare + "%"
          : "--%";
      const envCarbonText =
        dashboardCarbonTonnes != null
          ? dashboardCarbonTonnes.toLocaleString() + " tCO₂e"
          : "-- tCO₂e";

      const pdfEsgSummary = {
        Environmental:
          "Energy: " +
          envEnergyText +
          " · Renewables: " +
          envRenewablesText +
          " · Carbon: " +
          envCarbonText,
        Social: esgSummary.social,
        Governance: esgSummary.governance,
      };

      y += 10;
      doc.setFontSize(12);
      doc.text("ESG Summary:", 14, y);
      doc.setFontSize(11);
      y += 8;

      Object.entries(pdfEsgSummary).forEach(([key, value]) => {
        const lines = doc.splitTextToSize(key + ": " + value, 180);
        doc.text(lines, 14, y);
        y += lines.length * 6;
      });

      y += 10;
      doc.setFontSize(12);
      doc.text("AI Analyst Summary:", 14, y);
      doc.setFontSize(11);
      y += 8;

      if (!aiInsights || aiInsights.length === 0) {
        const lines = doc.splitTextToSize(
          "No AI analyst insights available yet.",
          180
        );
        doc.text(lines, 14, y);
        y += lines.length * 6;
      } else {
        aiInsights.forEach((note) => {
          const lines = doc.splitTextToSize("• " + note, 180);
          doc.text(lines, 14, y);
          y += lines.length * 6;
        });
      }
    };

    const img = new Image();
    img.src = africaEsgLogo;

    img.onload = () => {
      // Add logo at top-left
      doc.addImage(img, "PNG", 14, 10, 40, 40);

      // Start content below logo
      const startY = 35;
      buildPdfBody(startY);

      doc.save("AfricaESG_Overview_Report.pdf");
    };

    img.onerror = () => {
      console.warn(
        "Failed to load AfricaESG.AI logo, generating PDF without logo"
      );
      const startY = 20;
      buildPdfBody(startY);
      doc.save("AfricaESG_Overview_Report.pdf");
    };
  };

  // ---- Small helper components ----
  const StatCard = ({ icon, label, value, sub }) => (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 h-full">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shrink-0">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-xs text-slate-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-xl font-semibold text-slate-900">{value}</div>
        {sub && (
          <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
        )}
      </div>
    </div>
  );

  const MoneyCard = ({ icon, label, value, indicator, isFlagged }) => (
    <div
      className={
        "rounded-2xl border shadow-sm px-4 py-3 flex flex-col justify-between gap-2 h-full " +
        (isFlagged ? "bg-red-50 border-red-300" : "bg-white border-slate-100")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shrink-0">
            {icon}
          </span>
          <span className="text-xs text-slate-600 uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
        {indicator}
      </div>

      <div className="flex items-baseline gap-1 text-lg font-semibold text-slate-900 whitespace-nowrap tabular-nums">
        {typeof value === "string" && value.indexOf("R ") === 0 ? (
          <>
            <span className="text-sm text-slate-500">R</span>
            <span>{value.replace(/^R\s*/, "")}</span>
          </>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-lime-50 py-10 font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Row */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-green-900 tracking-tight">
              AfricaESG.AI Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 max-w-xl">
              ESG performance overview with AI-enabled insights on carbon tax,
              energy savings, and strategic ESG levers. Baselines are derived
              from your latest uploaded ESG dataset and electricity invoices.
            </p>

            <div className="mt-2 h-5">
              {(aiLoading || pillarAiLoading) && (
                <p className="text-xs text-emerald-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Loading ESG metrics and live AI insights…
                </p>
              )}
              {!aiLoading && !pillarAiLoading && (aiError || pillarAiError) && (
                <p className="text-xs text-red-500">
                  {aiError || pillarAiError}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full shadow flex items-center gap-2 text-sm font-semibold"
          >
            <FaFilePdf />
            Download ESG Report
          </button>
        </header>

        {/* Red Flag Panel */}
        {redFlags.length > 0 && (
          <section className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex gap-3 items-start">
            <FaExclamationTriangle className="text-red-500 mt-1 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-red-800 mb-1">
                Red Flags Detected
              </h2>
              <ul className="list-disc list-inside text-xs sm:text-sm text-red-900 space-y-1">
                {redFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Headline stats row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          <StatCard
            icon={<FaGlobeAfrica size={18} />}
            label="African countries supported"
            value={platformStats.countries_supported + "+"}
            sub="Regional ESG coverage"
          />
          <StatCard
            icon={<FaFileAlt size={18} />}
            label="ESG reports generated"
            value={platformStats.esg_reports_generated.toLocaleString()}
            sub="Automated & AI-assisted"
          />
          <StatCard
            icon={<FaShieldAlt size={18} />}
            label="Compliance accuracy"
            value={(platformStats.compliance_accuracy * 100).toFixed(1) + "%"}
            sub="Templates for IFRS, GRI, JSE"
          />
          <StatCard
            icon={<FaRobot size={18} />}
            label="AI analyst support"
            value={platformStats.ai_support_mode}
            sub="Continuous ESG monitoring"
          />
        </section>

        {/* ESG Performance Overview */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                ESG Performance Overview
              </h2>
            </div>

            {/* Pillar cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-stretch">
              {/* Environmental */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaCloud className="text-emerald-700" />
                      <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
                        Environmental
                      </span>
                    </div>
                    <button
                      className="text-[11px] text-emerald-700 font-semibold hover:underline"
                      onClick={() =>
                        navigate("/dashboard/environment/energy")
                      }
                    >
                      View details
                    </button>
                  </div>
                  <ul className="text-xs sm:text-sm text-emerald-900/90 space-y-1.5">
                    <li>
                      <span className="font-semibold">Energy</span>{" "}
                      {dashboardEnergyKWh != null
                        ? dashboardEnergyKWh.toLocaleString() + " kWh"
                        : "--"}
                    </li>
                    <li>
                      <span className="font-semibold">Renewables</span>{" "}
                      {envSummaryData.renewableEnergyShare != null
                        ? envSummaryData.renewableEnergyShare + "%"
                        : "--"}
                    </li>
                    <li>
                      <span className="font-semibold">Carbon</span>{" "}
                      {dashboardCarbonTonnes != null
                        ? dashboardCarbonTonnes.toLocaleString() + " tCO₂e"
                        : "--"}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Social */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-sky-700" />
                      <span className="text-xs font-semibold text-sky-900 uppercase tracking-wide">
                        Social
                      </span>
                    </div>
                    <button
                      className="text-[11px] text-sky-700 font-semibold hover:underline"
                      onClick={() => navigate("/dashboard/social")}
                    >
                      View details
                    </button>
                  </div>
                  <ul className="text-xs sm:text-sm text-sky-900/90 space-y-1.5">
                    <li>
                      <span className="font-semibold">Supplier Diversity</span>{" "}
                      {socSummaryData.supplierDiversity != null
                        ? socSummaryData.supplierDiversity + "%"
                        : "--"}
                    </li>
                    <li>
                      <span className="font-semibold">
                        Customer Satisfaction
                      </span>{" "}
                      {socSummaryData.customerSatisfaction != null
                        ? socSummaryData.customerSatisfaction + "%"
                        : "--"}
                    </li>
                    <li>
                      <span className="font-semibold">Human Capital</span>{" "}
                      {socSummaryData.humanCapital != null
                        ? socSummaryData.humanCapital + "%"
                        : "--"}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Governance */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaBalanceScaleLeft className="text-amber-700" />
                      <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                        Governance
                      </span>
                    </div>
                    <button
                      className="text-[11px] text-amber-700 font-semibold hover:underline"
                      onClick={() =>
                        navigate("/dashboard/governance/corporate")
                      }
                    >
                      View details
                    </button>
                  </div>
                  <ul className="text-xs sm:text-sm text-amber-900/90 space-y-1.5">
                    <li>
                      <span className="font-semibold">
                        Corporate Governance
                      </span>{" "}
                      {govSummaryData.corporateGovernance ?? "--"}
                    </li>
                    <li>
                      <span className="font-semibold">ISO 9001</span>{" "}
                      {govSummaryData.iso9001Compliance ?? "--"}
                    </li>
                    <li>
                      <span className="font-semibold">Business Ethics</span>{" "}
                      {govSummaryData.businessEthics ?? "--"}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Financial / carbon KPIs row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <MoneyCard
                icon={<FaIndustry size={15} />}
                label="Carbon Tax (2024/2025)"
                value={"R " + carbonTax.toLocaleString()}
                indicator={renderIndicator(carbonTax, prevCarbonTax)}
                isFlagged={carbonTax > 20000000}
              />
              <MoneyCard
                icon={<FaCloud size={15} />}
                label="Applicable Tax Allowances"
                value={"R " + taxAllowances.toLocaleString()}
                indicator={renderIndicator(
                  taxAllowances,
                  prevTaxAllowances
                )}
                isFlagged={false}
              />
              <MoneyCard
                icon={<FaTrash size={15} />}
                label="Carbon Credits Generated"
                value={carbonCredits.toLocaleString() + " tonnes"}
                indicator={renderIndicator(
                  carbonCredits,
                  prevCarbonCredits
                )}
                isFlagged={false}
              />
              <MoneyCard
                icon={<FaTint size={15} />}
                label="Energy Savings"
                value={energySavings.toLocaleString() + " kWh"}
                indicator={renderIndicator(
                  energySavings,
                  prevEnergySavings
                )}
                isFlagged={false}
              />
            </div>
          </div>
        </section>

        {/* AI Mini Report – full width */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-gray-800">
                AI Mini Report on ESG Summary
              </h2>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Live AI
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Baseline position, benchmark band and AI recommendations based on
              the latest ESG scores and invoice-derived energy/carbon baselines.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold text-slate-800 mb-0.5">
                  1. Baseline
                </h3>
                <p className="text-xs text-slate-700">
                  {miniReport.baseline || "Baseline not available yet."}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-0.5">
                  2. Benchmark
                </h3>
                <p className="text-xs text-slate-700">
                  {miniReport.benchmark || "Benchmark not available yet."}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-0.5">
                  3. Performance vs benchmark
                </h3>
                <p className="text-xs text-slate-700">
                  {miniReport.performance_vs_benchmark ||
                    "Performance vs benchmark not available yet."}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-0.5">
                  4. AI Recommendations
                </h3>
                {miniReport.ai_recommendations &&
                miniReport.ai_recommendations.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {miniReport.ai_recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    No AI recommendations generated yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
