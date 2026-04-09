"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/DataTable";
import { CHART_COLORS } from "@/lib/chartEngine";
import type { ChartConfig } from "@/types/spreadsheet";

interface ChartCardProps {
  config: ChartConfig;
}

export function ChartCard({ config }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartRenderer config={config} />
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ config }: { config: ChartConfig }) {
  switch (config.type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={config.xKey}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} />
            <Tooltip />
            <Legend />
            {config.yKey && (
              <Line
                type="monotone"
                dataKey={config.yKey}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );

    case "bar":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={config.xKey}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} />
            <Tooltip />
            <Legend />
            {config.yKey && (
              <Bar dataKey={config.yKey} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case "barHorizontal":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={config.data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis
              dataKey={config.yKey}
              type="category"
              tick={{ fontSize: 11 }}
              tickLine={false}
              width={100}
            />
            <Tooltip />
            <Bar dataKey={config.xKey} fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={config.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {config.data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case "table":
    default:
      return <DataTable data={config.data} />;
  }
}
