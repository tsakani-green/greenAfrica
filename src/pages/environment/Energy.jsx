// src/pages/environment/Energy.jsx
import React, { useContext, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { FaFilePdf, FaSun } from "react-icons/fa"; // Added FaSun for the header icon
import { jsPDF } from "jspdf";
import { SimulationContext } from "../../context/SimulationContext";
import AIInsightPanel from "../../components/AIInsightPanel";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Energy() {
  const {
    environmentalMetrics,
    environmentalInsights,
    environmentalBenchmarks,
    loading,
    error,
  } = useContext(SimulationContext);

  const [energyUseValues, setEnergyUseValues] = useState(new Array(12).fill(0));
  const [productionDataValues, setProductionDataValues] = useState(
    new Array(12).fill(0)
  );
  const [energyIntensityValues, setEnergyIntensityValues] = useState(
    new Array(12).fill(0)
  );
  const [topInsights, setTopInsights] = useState([]);

  const monthlyLabels = [
    "Jan-24",
    "Feb-24",
    "Mar-24",
    "Apr-24",
    "May-24",
    "Jun-24",
    "Jul-24",
    "Aug-24",
    "Sep-24",
    "Oct-24",
    "Nov-24",
    "Dec-24",
  ];

  const toTwelve = (arr) =>
    monthlyLabels.map((_, i) => {
      const v = Array.isArray(arr) ? arr[i] : 0;
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    });

  useEffect(() => {
    if (environmentalMetrics) {
      const energyUseRaw = environmentalMetrics.energyUse || [];
      const productionRaw = environmentalMetrics.production || [];

      const energyUse12 = toTwelve(energyUseRaw);
      const production12 = toTwelve(productionRaw);

      const energyIntensity12 = energyUse12.map((e, i) => {
        const p = production12[i] || 1;
        return Number((e / p).toFixed(4));
      });

      setEnergyUseValues(energyUse12);
      setProductionDataValues(production12);
      setEnergyIntensityValues(energyIntensity12);
    } else {
      setEnergyUseValues(new Array(12).fill(0));
      setProductionDataValues(new Array(12).fill(0));
      setEnergyIntensityValues(new Array(12).fill(0));
    }

    const insights =
      environmentalInsights && environmentalInsights.length > 0
        ? environmentalInsights.slice(0, 5)
        : [];

    setTopInsights(insights);
  }, [environmentalMetrics, environmentalInsights]);

  // ---------- AI-style baseline / benchmark calculations ----------

  const nonZeroIntensities = energyIntensityValues.filter((v) => v > 0);

  let baselineIntensity = null;
  if (nonZeroIntensities.length > 0) {
    const baselineSlice = nonZeroIntensities.slice(0, 3);
    baselineIntensity =
      baselineSlice.reduce((sum, v) => sum + v, 0) / baselineSlice.length;
  }

  let currentIntensity = null;
  if (nonZeroIntensities.length > 0) {
    currentIntensity = nonZeroIntensities[nonZeroIntensities.length - 1];
  }

  const benchmarkIntensityRaw =
    environmentalBenchmarks?.energyIntensity ?? baselineIntensity;

  const comparisonDelta =
    currentIntensity != null && benchmarkIntensityRaw != null
      ? currentIntensity - benchmarkIntensityRaw
      : null;

  const comparisonPercent =
    currentIntensity != null &&
    benchmarkIntensityRaw != null &&
    benchmarkIntensityRaw !== 0
      ? (comparisonDelta / benchmarkIntensityRaw) * 100
      : null;

  const energyData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Energy Use (MWh)",
        data: energyUseValues,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: "Production Output (tonnes)",
        data: productionDataValues,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };

  const intensityData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Energy Intensity (MWh per tonne)",
        data: energyIntensityValues,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.2)",
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("AfricaESG.AI Energy Use Report", 14, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);

    y += 10;
    doc.text("Energy Use & Production:", 14, y);
    y += 8;

    monthlyLabels.forEach((label, idx) => {
      const line = `${label}: Energy Use ${
        energyUseValues[idx] || 0
      } MWh, Production ${
        productionDataValues[idx] || 0
      } tonnes, Intensity ${energyIntensityValues[idx] || 0} MWh/tonne`;
      const wrapped = doc.splitTextToSize(line, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 6;
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("AI Analysis – Energy Performance:", 14, y);
    y += 8;

    (topInsights.length > 0
      ? topInsights
      : ["No AI insights available for this dataset."]
    ).forEach((note) => {
      const wrapped = doc.splitTextToSize(`• ${note}`, 180);
      doc.setFont("helvetica", "normal");
      doc.text(wrapped, 14, y);
      y += wrapped.length * 6;
    });

    doc.save("AfricaESG_EnergyReport.pdf");
  };

  const showEmptyState =
    !loading && !error && energyUseValues.every((v) => v === 0) && productionDataValues.every((v) => v === 0);

  const latestIndex = energyUseValues.length - 1;
  const latestEnergyUse = energyUseValues[latestIndex] || 0;
  const latestProduction = productionDataValues[latestIndex] || 0;
  const latestIntensity = energyIntensityValues[latestIndex] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-lime-50/40 to-teal-50 py-10 font-sans flex justify-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-600 font-semibold mb-1">
              Environmental · Energy
            </p>
            <h1 className="flex items-center gap-2 text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
              <FaSun className="text-teal-700 text-3xl sm:text-4xl" />
              <span>Energy Use & Intensity</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600 max-w-xl">
              Track energy use, production and intensity across your operations
              with AI insights for performance improvement.
            </p>
            {loading && (
              <p className="mt-2 text-xs text-teal-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Loading energy metrics and AI insights…
              </p>
            )}
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>

          <button
            onClick={handleDownloadReport}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 text-sm md:text-base font-medium transition-transform hover:scale-105"
          >
            <FaFilePdf className="text-white text-base md:text-lg" />
            Download Energy Report
          </button>
        </div>

        {/* Quick Stats */}
        {!showEmptyState && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-teal-100 shadow-sm px-4 py-3">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                Latest Energy Use
              </p>
              <p className="text-2xl font-bold text-teal-900">
                {latestEnergyUse.toLocaleString()}{" "}
                <span className="text-xs font-medium text-gray-500">MWh</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Energy consumed in the latest reporting month.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-teal-100 shadow-sm px-4 py-3">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                Latest Production
              </p>
              <p className="text-2xl font-bold text-teal-900">
                {latestProduction.toLocaleString()}{" "}
                <span className="text-xs font-medium text-gray-500">
                  tonnes
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Output associated with current energy profile.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-teal-100 shadow-sm px-4 py-3">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                Latest Energy Intensity
              </p>
              <p className="text-2xl font-bold text-teal-900">
                {latestIntensity.toFixed(2)}{" "}
                <span className="text-xs font-medium text-gray-500">
                  MWh / tonne
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Energy efficiency for production.
              </p>
            </div>
          </div>
        )}

        {showEmptyState ? (
          <div className="bg-white rounded-2xl shadow-lg border border-dashed border-teal-200 p-10 text-center text-gray-600">
            <p className="text-base font-medium mb-2">
              No energy metrics available yet.
            </p>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Upload ESG data on the main dashboard to populate energy use and
              intensity for this view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-teal-100/70 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                    Energy Use vs Production (Monthly)
                  </h2>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold uppercase tracking-wide">
                    Uploaded dataset
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Monthly energy consumption compared with production volumes.
                </p>
                <div className="h-64 sm:h-72">
                  <Line
                    data={energyData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "bottom", labels: { boxWidth: 12 } },
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: {
                          grid: { color: "#e5e7eb" },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-teal-100/70 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                    Energy Intensity (MWh per tonne)
                  </h2>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wide">
                    Energy KPI
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Energy consumption normalised by production.
                </p>
                <div className="h-64 sm:h-72">
                  <Line
                    data={intensityData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "bottom", labels: { boxWidth: 12 } },
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: {
                          grid: { color: "#e5e7eb" },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* AI baseline / benchmark / comparison / recommendations */}
            <AIInsightPanel
              topic="Energy"
              baselineIntensity={baselineIntensity}
              benchmarkIntensity={benchmarkIntensityRaw}
              currentIntensity={currentIntensity}
              comparisonDelta={comparisonDelta}
              comparisonPercent={comparisonPercent}
              insights={topInsights}
              loading={loading}
              intensityUnit="MWh/tonne"
              borderColor="teal-100"
              baselineLabel="Average baseline energy intensity"
            />
          </div>
        )}
      </div>
    </div>
  );
}
