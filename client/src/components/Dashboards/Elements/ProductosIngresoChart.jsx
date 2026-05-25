import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {useProductosIngresoData} from "../hooks/useDashboardData";

export function ProductosIngresoChart({fechas}) {
  const {data, isLoading, isError, error} = useProductosIngresoData(fechas);

  const formatCurrencyAxis = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const formatNameAxis = (value) => {
    if (typeof value === "string" && value.length > 20) {
      return `${value.substring(0, 18)}...`;
    }
    return value;
  };

  if (isLoading) {
    return (
      <div style={{height: 300, display: "flex", alignItems: "center"}}>
        <p className="w-full text-center">Cargando datos...</p>
      </div>
    );
  }

  if (isError) {
    return <p style={{color: "red"}}>Error: {error.message}</p>;
  }

  const chartData = (data || []).slice(0, 5);

  return (
    <>
      <h3 style={{fontSize: "1rem", fontWeight: 600, color: "#333"}}>
        Mejores productos por ingresos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{top: 5, right: 30, left: 40, bottom: 5}}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
          <XAxis type="number" tickFormatter={formatCurrencyAxis} />
          <YAxis
            dataKey="nombre"
            type="category"
            width={130}
            tickFormatter={formatNameAxis}
            tick={{fontSize: 11}}
          />
          <Tooltip
            formatter={(value) => [
              `$${value.toLocaleString()}`,
              "Ingreso Total Generado",
            ]}
          />
          <Bar
            dataKey="valor"
            fill="#82ca9d"
            barSize={30}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}