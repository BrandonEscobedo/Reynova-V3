import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {useClientesStatusData} from "../hooks/useDashboardData";

export function ClienteChart() {
  const {data, isLoading, isError, error} = useClientesStatusData();
  const COLORS = ["#4caf50", "#e57373"];

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

  return (
    <>
      <h3 style={{fontSize: "1rem", fontWeight: 600, color: "#333"}}>
        Estado de clientes
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}