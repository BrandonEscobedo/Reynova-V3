

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Button as MuiButton } from "@mui/material"; 
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useAlert } from "../../shared/Alerts/AlertContext";


export const DetalleCliente = () => {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    const getClientData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "Clientes", clienteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCliente({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No se encontró el cliente!");
          setCliente(null);
        }
      } catch (error) {
        console.error("Error al obtener el cliente:", error);
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      getClientData();
    }
  }, [clienteId]);

  const performDelete = async () => {
    try {
      const clienteDocRef = doc(db, "Clientes", clienteId);
      await deleteDoc(clienteDocRef);
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      showAlert('success', "Cliente eliminado con éxito.");
      navigate('/clientes');
    } catch (error) {
      console.error("Error al eliminar el cliente: ", error);
      showAlert('error', "Ocurrió un error al intentar eliminar el cliente.");
    } finally {
      setConfirmVisible(false);
    }
  };

  const handleDelete = () => {
    setConfirmVisible(true);
  };

  if (loading) {
    return <div className="p-8 text-center"><h1>Cargando información del cliente...</h1></div>;
  }

  if (!cliente) {
    return <div className="p-8 text-center"><h1>Cliente no encontrado.</h1></div>;
  }

  const displayObjectKeys = (obj) => {
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
      return Object.keys(obj).join(', ');
    }
    return 'N/A';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <MuiButton
        variant="text"
        onClick={() => navigate('/clientes')}
        startIcon={<ArrowLeft size={18} />}
        className="mb-6"
      >
        Volver a Clientes
      </MuiButton>

      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{cliente.nombreEmpresa}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Estado</h3>
            <p className={`font-semibold ${cliente.activo ? 'text-green-600' : 'text-red-600'}`}>
              {cliente.activo ? "Activo" : "Inactivo"}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Giro</h3>
            <p className="text-lg text-gray-800">{cliente.giro || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Vertical</h3>
            <p className="text-lg text-gray-800">{cliente.vertical || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Teléfono</h3>
            <p className="text-lg text-gray-800">{cliente.telefono || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm text-gray-500 uppercase">Dirección Completa</h3>
            <p className="text-lg text-gray-800">{cliente.direccionCompleta || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Clientes de la Empresa</h3>
            <p className="text-lg text-gray-800">{displayObjectKeys(cliente.clientesDeLaEmpresa)}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Productos de Interés</h3>
            <p className="text-lg text-gray-800">{displayObjectKeys(cliente.productosInteres)}</p>
          </div>
        </div>

        {cliente.contactos && cliente.contactos.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contactos</h2>
            <div className="space-y-4">
              {cliente.contactos.map((contacto, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="font-bold text-lg">{contacto.nombre} {contacto.apellidos}</p>
                  <p className="text-md text-gray-600">{contacto.puesto}</p>
                  <div className="mt-2">
                    <p className="text-sm"><strong>Correo:</strong> {contacto.email || 'N/A'}</p>
                    <p className="text-sm"><strong>Teléfono:</strong> {contacto.telefono || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col gap-4">
          {confirmVisible && (
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-red-200 bg-red-50">
              <span className="text-sm md:text-base text-red-800">
                ¿Desea eliminar al cliente "{cliente.nombreEmpresa}"? Esta acción no se puede deshacer.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmVisible(false)}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={performDelete}
                  className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-end items-center gap-4">
          <MuiButton
            variant="contained"
            onClick={() => navigate(`/clientes/Editar/${clienteId}`)}
            startIcon={<Edit size={18} />}
          >
            Editar Cliente
          </MuiButton>

          <MuiButton
            variant="contained"
            color="error"
            onClick={handleDelete}
            startIcon={<Trash2 size={18} />}
          >
            Eliminar Cliente
          </MuiButton>
          </div>
        </div>
      </div>
    </div>
  );
};