"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Pt = { name?: string; month?: string; value: number };
const NAVY = "#0b1f3a";
const GOLD = "#c9a24b";
const PALETTE = ["#0b1f3a", "#2a4570", "#c9a24b", "#8aa0c0", "#dcbd70", "#4f6a93", "#a98235", "#b6c5db"];

export function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <section className="card p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold text-navy-600">{title}</h3>
      <div className="h-64">{empty ? <p className="flex h-full items-center justify-center text-sm text-navy-300">No data yet</p> : children}</div>
    </section>
  );
}

export function TrendChart({ data, money }: { data: Pt[]; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={money ? 56 : 32} tickFormatter={(v) => (money ? `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}` : String(v))} />
        <Tooltip formatter={(v) => (money ? `₹${Number(v).toLocaleString("en-IN")}` : v)} />
        <Line type="monotone" dataKey="value" stroke={money ? GOLD : NAVY} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, horizontal }: { data: Pt[]; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 24 : 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={!horizontal} vertical={!!horizontal} />
        {horizontal ? <><XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} /><YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={12} /></> : <><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} width={32} /></>}
        <Tooltip />
        <Bar dataKey="value" fill={NAVY} radius={[6, 6, 6, 6]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: Pt[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
