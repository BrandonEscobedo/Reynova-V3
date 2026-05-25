import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import UtilidadNetaChart from './Elements/UtilidadNetaChart';
import { VentaChart } from "./Elements/VentaChart";
import { ClienteChart } from "./Elements/ClienteChart";
import { CreditoChart } from "./Elements/CreditoChart";
import { CotizacionChart } from "./Elements/CotizacionChart";
import { VentasCategoriaChart } from "./Elements/VentasCategoriaChart";
import { TopModelosChart } from "./Elements/TopModelosChart";
import { VentasDiaChart } from "./Elements/VentasDiaChart";
import { ProductosIngresoChart } from "./Elements/ProductosIngresoChart";
import { MetodosPagoChart } from "./Elements/MetodosPagoChart";

// Importaciones de la nueva arquitectura
import { ChatbotUI } from "./Elements/ChatbotUI";
import { ModalReportes } from "./Elements/ModalReportes";

const fechasIniciales = { fechaInicio: "", fechaFin: "" };

export function Dashboard() {
  const queryClient = useQueryClient();
  const [fechas, setFechas] = useState(fechasIniciales);
  
  // Solo necesitamos el estado para abrir el modal de reportes desde este nivel
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleFechaChange = (e) => {
    setFechas({ ...fechas, [e.target.name]: e.target.value });
    // Invalida el cache de React Query para forzar un refetch con las nuevas fechas
    queryClient.invalidateQueries({ queryKey: ["mainDashboard"] });
  };

  const Card = ({ children, height = "350px" }) => (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        backgroundColor: "#ffffff",
        height: height,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ padding: "24px", backgroundColor: "#f4f7f6" }} className="relative min-h-screen">
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          alignItems: "center",
          padding: "16px",
          backgroundColor: "white",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>
            Panel de Estadísticas Avanzado
          </h2>
          {/* Mantenemos el botón aquí */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg shadow hover:bg-slate-700 transition-colors"
          >
            📄 Exportar Reporte
          </button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
          <input
            type="date"
            name="fechaInicio"
            value={fechas.fechaInicio || ""}
            onChange={handleFechaChange}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: 4 }}
          />
          <input
            type="date"
            name="fechaFin"
            value={fechas.fechaFin || ""}
            onChange={handleFechaChange}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <Card height="auto">
          <CotizacionChart fechas={fechas} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Agregamos la nueva gráfica de Utilidad Neta en el grid principal */}
        <Card><UtilidadNetaChart fechas={fechas} /></Card>
        
        <Card><VentaChart fechas={fechas} /></Card>
        <Card><ClienteChart /></Card>
        <Card><CreditoChart fechas={fechas} /></Card>
        
        <Card><VentasCategoriaChart fechas={fechas} /></Card>
        <Card><TopModelosChart fechas={fechas} /></Card>
        <Card><VentasDiaChart fechas={fechas} /></Card>
        <Card><ProductosIngresoChart fechas={fechas} /></Card>
        <Card><MetodosPagoChart fechas={fechas} /></Card>
      </div>

      {/* Invocamos los componentes */}
      <ModalReportes 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        fechasSeleccionadas={fechas}
      />
      <ChatbotUI />

    </div>
  );
}