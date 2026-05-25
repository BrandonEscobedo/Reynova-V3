import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {useVentasDiaData} from "../hooks/useDashboardData";

export function VentasDiaChart({fechas}) {
  const {data, isLoading, isError, error} = useVentasDiaData(fechas);

  const formatCurrencyAxis = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const formatCurrencyTooltip = (value) => {
    return `$${value.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
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

  const chartData = data || [];

  return (
    <>
      <h3 style={{fontSize: "1rem", fontWeight: 600, color: "#333"}}>
        Tendencia diaria
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ left: 15 }}> {/* Margen extra a la izquierda */}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" tick={{fontSize: 12}} />
          
          <YAxis 
            tickFormatter={formatCurrencyAxis} 
            width={45}
            tick={{fontSize: 11}}
          />
          
          <Tooltip 
            formatter={(value) => [formatCurrencyTooltip(value), "Ventas del día"]}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          
          <Area
            type="monotone"
            dataKey="montoTotal"
            stroke="#ff7300"
            fill="#ff7300"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}