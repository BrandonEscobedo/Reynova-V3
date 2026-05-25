import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {useModelosData} from "../hooks/useDashboardData";

export function TopModelosChart({fechas}) {
  const {data, isLoading, isError, error} = useModelosData(fechas);

  const formatNameAxis = (value) => {
    if (typeof value === "string" && value.length > 15) {
      return `${value.substring(0, 15)}...`;
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

  const chartData = (data || []).slice(0, 7);

  return (
    <>
      <h3 style={{fontSize: "1rem", fontWeight: 600, color: "#333"}}>
        Mejores modelos vendidos por cantidad
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{top: 5, right: 30, left: 20, bottom: 5}}
        >
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="nombre"
            type="category"
            width={110}
            tick={{fontSize: 11}}
            tickFormatter={formatNameAxis}
          />
          
          <Tooltip 
            formatter={(value) => [value, "Piezas vendidas"]}
            cursor={{fill: 'transparent'}}
          />
          
          <Bar 
            dataKey="valor" 
            fill="#8884d8" 
            barSize={20}
            radius={[0, 4, 4, 0]} 
            name="Piezas"
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}