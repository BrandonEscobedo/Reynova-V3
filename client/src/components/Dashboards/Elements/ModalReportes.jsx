import {useMemo, useState} from "react";
import {dashboardService} from "../services/dashboard_services";
import {generarPDFResumenVentas} from "../services/reportes_pdf.service";
import {generarExcelResumenVentas} from "../services/reportes_excel.service";

const FORMATO_PDF = "PDF";
const FORMATO_EXCEL = "Excel";

const toDateInput = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getMesActualRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {fechaInicio: toDateInput(start), fechaFin: toDateInput(end)};
};

const getMesAnteriorRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {fechaInicio: toDateInput(start), fechaFin: toDateInput(end)};
};

export function ModalReportes({isOpen, onClose, fechasSeleccionadas}) {
  const [periodo, setPeriodo] = useState("este_mes");
  const [formato, setFormato] = useState(FORMATO_PDF);
  const [fechasCustom, setFechasCustom] = useState({
    fechaInicio: fechasSeleccionadas?.fechaInicio || "",
    fechaFin: fechasSeleccionadas?.fechaFin || "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const periodoTexto = useMemo(() => {
    if (periodo === "este_mes") return "Este mes";
    if (periodo === "mes_anterior") return "Mes anterior";
    return "Personalizado";
  }, [periodo]);

  const getFechasFiltro = () => {
    if (periodo === "este_mes") return getMesActualRange();
    if (periodo === "mes_anterior") return getMesAnteriorRange();
    return fechasCustom;
  };

  const handleGenerarReporte = async () => {
    setErrorMsg("");

    const fechas = getFechasFiltro();
    if (!fechas.fechaInicio || !fechas.fechaFin) {
      setErrorMsg("Debes seleccionar fecha de inicio y fecha fin.");
      return;
    }

    if (new Date(fechas.fechaInicio) > new Date(fechas.fechaFin)) {
      setErrorMsg("La fecha de inicio no puede ser mayor que la fecha fin.");
      return;
    }

    try {
      setIsGenerating(true);
      const data = await dashboardService.getDashboardData(fechas);

      const payload = {
        periodo: periodoTexto,
        fechas,
        resumenGeneral: data?.resumenGeneral,
        ventasPorCategoria: data?.ventasPorCategoria,
        topProductosIngreso: data?.topProductosIngreso,
        ventasPorDia: data?.ventasPorDia,
      };

      if (formato === FORMATO_PDF) {
        generarPDFResumenVentas(payload);
      } else if (formato === FORMATO_EXCEL) {
        generarExcelResumenVentas(payload);
      } else {
        setErrorMsg("Formato de archivo no soportado.");
        return;
      }

      onClose();
    } catch (error) {
      setErrorMsg(error?.message || "No fue posible generar el reporte.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">Configurar Reporte</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        
        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-gray-700"
            >
              <option value="este_mes">Este mes</option>
              <option value="mes_anterior">Mes anterior</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          {periodo === "personalizado" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={fechasCustom.fechaInicio}
                  onChange={(e) =>
                    setFechasCustom((prev) => ({
                      ...prev,
                      fechaInicio: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={fechasCustom.fechaFin}
                  onChange={(e) =>
                    setFechasCustom((prev) => ({
                      ...prev,
                      fechaFin: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-gray-700"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-gray-700"
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
            </select>
          </div>
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl">
            <span className="text-5xl mb-2">{formato === FORMATO_PDF ? "📄" : "📊"}</span>
            <span className="text-sm text-gray-500 font-medium">Vista previa del documento</span>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose} 
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleGenerarReporte}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 shadow-md transition-colors"
          >
            {isGenerating ? "Generando..." : "Generar y Descargar"}
          </button>
        </div>
      </div>
    </div>
  );
}