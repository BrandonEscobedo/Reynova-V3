import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {useClientesData} from "../hooks/useDashboardData";

export function CreditoChart({fechas}) {
  const {data, isLoading, isError, error} = useClientesData(fechas);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const formatYAxis = (value) => {
    if (typeof value === "string" && value.length > 20) {
      return `${value.substring(0, 18)}...`;
    }
    return value;
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
      Mejores clientes por ingreso
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

  const chartData = (data || []).slice(0, 5);

  return (
    <>
      <ChartTitle />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{top: 5, right: 30, left: 20, bottom: 5}}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={formatCurrency} />
          <YAxis
            dataKey="nombre"
            type="category"
            width={120}
            tick={{fontSize: 11}}
            tickFormatter={formatYAxis}
            interval={0}
          />
          <Tooltip
            formatter={(value) => [
              `$${value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              "Monto Total",
            ]}
          />
          <Bar
            dataKey="montoAcumulado"
            name="Monto"
            fill="#82ca9d"
            barSize={30}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}