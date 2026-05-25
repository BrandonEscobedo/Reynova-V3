import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {useMetodosPagoData} from "../hooks/useDashboardData";

export function MetodosPagoChart({fechas}) {
  const {data, isLoading, isError, error} = useMetodosPagoData(fechas);
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

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

  const chartData = data || [];

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#333",
            marginBottom: "20px",
          }}
        >
          Métodos de pago
        </h3>
        <p className="text-gray-500">No hay datos para este periodo.</p>
      </div>
    );
  }

  return (
    <>
      <h3 style={{fontSize: "1rem", fontWeight: 600, color: "#333"}}>
        Métodos de pago
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            label={({percent}) => `${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, "Transacciones"]} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}