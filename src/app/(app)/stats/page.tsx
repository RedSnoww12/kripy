"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeightData } from "@/types";

type Range = "7d" | "30d" | "90d" | "all";

export default function StatsPage() {
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [range, setRange] = useState<Range>("30d");
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [wRes, sRes] = await Promise.all([
          fetch("/api/weight"),
          fetch("/api/analysis"),
        ]);
        if (wRes.ok) setWeights(await wRes.json());
        if (sRes.ok) setStats(await sRes.json());
      } catch {
        // Offline
      }
    }
    load();
  }, []);

  const now = new Date();
  const filteredWeights = weights.filter((w) => {
    if (range === "all") return true;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(w.date) >= cutoff;
  });

  const chartData = filteredWeights.map((w) => ({
    date: w.date.slice(5), // MM-DD
    poids: w.weight,
  }));

  const ranges: { key: Range; label: string }[] = [
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "90d", label: "90j" },
    { key: "all", label: "Tout" },
  ];

  const weightStats = stats as {
    weightStats?: {
      current: number;
      bmi: string;
      avg7: number;
      avg30: number;
      rate: number;
      estDays: number | null;
      regularity: number;
      min: number;
      max: number;
      total: number;
    };
    trend?: {
      dir: string;
      rate: number;
      confidence: string;
      daysOnPalier: number;
    };
  } | null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent mb-4">
        Statistiques
      </h2>

      {/* Range selector */}
      <div className="flex gap-1.5 mb-4">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              range === r.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary border border-border text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Weight chart */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
          Evolution du poids
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Area
                type="monotone"
                dataKey="poids"
                stroke="var(--purple)"
                fill="url(#weightGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center py-8 text-xs text-muted-foreground">
            Pas assez de donnees pour afficher le graphique
          </p>
        )}
      </div>

      {/* Weight stats grid */}
      {weightStats?.weightStats && (
        <div className="bg-card border border-border rounded-2xl p-3 mb-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
            Statistiques poids
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Actuel", value: `${weightStats.weightStats.current} kg` },
              { label: "IMC", value: weightStats.weightStats.bmi },
              { label: "Moy. 7j", value: `${weightStats.weightStats.avg7} kg` },
              { label: "Moy. 30j", value: `${weightStats.weightStats.avg30} kg` },
              { label: "Rythme", value: `${weightStats.weightStats.rate} kg/sem` },
              { label: "Regularite", value: `${weightStats.weightStats.regularity}%` },
              { label: "Min", value: `${weightStats.weightStats.min} kg` },
              { label: "Max", value: `${weightStats.weightStats.max} kg` },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">
                  {s.label}
                </div>
                <div className="text-sm font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          {weightStats.weightStats.estDays && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Objectif atteint dans environ{" "}
              <strong>{weightStats.weightStats.estDays} jours</strong>
            </div>
          )}
        </div>
      )}

      {/* Trend info */}
      {weightStats?.trend && weightStats.trend.dir !== "observing" && (
        <div className="bg-card border border-border rounded-2xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
            Tendance
          </div>
          <div className="text-sm">
            Direction:{" "}
            <strong>
              {weightStats.trend.dir === "down_fast" ? "Baisse rapide" :
               weightStats.trend.dir === "down" ? "Baisse" :
               weightStats.trend.dir === "stable" ? "Stable" :
               weightStats.trend.dir === "up" ? "Hausse" : "Hausse rapide"}
            </strong>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {weightStats.trend.rate} kg/sem · Confiance: {weightStats.trend.confidence} · {weightStats.trend.daysOnPalier}j sur ce palier
          </div>
        </div>
      )}
    </div>
  );
}
