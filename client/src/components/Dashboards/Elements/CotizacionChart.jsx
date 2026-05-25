import {useResumenData} from "../hooks/useDashboardData";

export function CotizacionChart({fechas}) {
  const {data, isLoading, isError, error} = useResumenData(fechas);

  const formatCurrency = (value) => {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <div style={{height: 150, display: "flex", alignItems: "center"}}>
        <p className="w-full text-center">Cargando resumen...</p>
      </div>
    );
  }

  if (isError) {
    return <p style={{color: "red"}}>Error: {error.message}</p>;
  }

  const {montoTotal = 0, totalVentas = 0, ticketPromedio = 0} = data || {};

  const cardStyle = {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    border: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "120px",
  };

  const labelStyle = {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
  };

  const valueStyle = {
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#1976d2",
    margin: 0,
  };

  return (
    <div style={{width: "100%"}}>
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          margin: "0 0 16px 0",
          color: "#333",
        }}
      >
        Resumen general de ventas
      </h3>
      
      <div style={{display: "flex", gap: "20px", justifyContent: "space-between"}}>
        
        <div style={cardStyle}>
          <div style={labelStyle}>Ingresos totales</div>
          <p style={valueStyle}>{formatCurrency(montoTotal)}</p>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Ventas totales</div>
          <p style={{...valueStyle, color: "#00C49F"}}>
            {totalVentas}
          </p>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Venta promedio</div>
          <p style={{...valueStyle, color: "#FF8042"}}>
            {formatCurrency(ticketPromedio)}
          </p>
        </div>

      </div>
    </div>
  );
}