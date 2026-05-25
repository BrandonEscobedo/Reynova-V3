/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery } from "@tanstack/react-query";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";

const fechaAMilisegundos = (fecha) => {
  if (!fecha) return 0;
  if (typeof fecha.toDate === "function") return fecha.toDate().getTime();
  const ms = new Date(fecha).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const resolverFechaUltimaCotizacion = (fechaGuardada, fechaDesdeCotizaciones) => {
  const msGuardada = fechaAMilisegundos(fechaGuardada);
  const msCotizaciones = fechaAMilisegundos(fechaDesdeCotizaciones);

  if (msGuardada === 0 && msCotizaciones === 0) return null;
  if (msGuardada >= msCotizaciones) return fechaGuardada ?? fechaDesdeCotizaciones;
  return fechaDesdeCotizaciones ?? fechaGuardada;
};

export function useGetClients() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      try {
        const [clientesSnap, cotizacionesSnap] = await Promise.all([
          getDocs(collection(db, "Clientes")),
          getDocs(collection(db, "cotizaciones")),
        ]);

        const ultimaCotizacionPorCliente = {};
        cotizacionesSnap.docs.forEach((cotDoc) => {
          const { clienteId, createdAt } = cotDoc.data();
          if (!clienteId || !createdAt) return;

          const ms = fechaAMilisegundos(createdAt);
          if (ms > fechaAMilisegundos(ultimaCotizacionPorCliente[clienteId])) {
            ultimaCotizacionPorCliente[clienteId] = createdAt;
          }
        });

        return clientesSnap.docs.map((clientDoc) => {
          const data = clientDoc.data();
          return {
            ...data,
            id: clientDoc.id,
            fechaUltimaCotizacion: resolverFechaUltimaCotizacion(
              data.fechaUltimaCotizacion,
              ultimaCotizacionPorCliente[clientDoc.id]
            ),
          };
        });
      } catch (error) {
        console.error("Error obteniendo clientes:", error);
        throw new Error("No se pudieron cargar los clientes");
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}
