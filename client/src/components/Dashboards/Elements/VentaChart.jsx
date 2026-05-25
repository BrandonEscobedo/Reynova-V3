import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {useVentasData} from "../hooks/useDashboardData";

export function VentaChart({fechas}) {
  const {data, isLoading, isError, error} = useVentasData(fechas);

  const formatYAxis = (tick) => {
    if (tick >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
    if (tick >= 1000) return `${(tick / 1000).toFixed(0)}k`;
    return tick;
  };

  const ChartTitle = () => (
    <h3
      style={{
        fontSize: "1rem",
        fontWeight: 600,
        margin: "0 0 16px 0",
        color: "#333",
      }}
    >
      Ventas por mes
    </h3>
  );

  if (isLoading) {
    return (
      <>
        <ChartTitle />
        <div
          style={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Cargando datos...</p>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <ChartTitle />
        <div
          style={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{color: "red"}}>Error: {error.message}</p>
        </div>
      </>
    );
  }

  const chartData = data || [];

  return (
    <>
      <ChartTitle />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mesDisplay" tick={{fontSize: 12}} />
          <YAxis tickFormatter={formatYAxis} width={40} />
          <Tooltip
            formatter={(value, name) => {
              if (name === "Monto Total") {
                return [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
              }
              return [value, name];
            }}
          />
          <Legend />
          <Bar
            dataKey="montoTotal"
            name="Monto Total"
            fill="#1976d2"
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}