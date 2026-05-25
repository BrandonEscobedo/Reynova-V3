import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClienteSchema } from "./schemas/cliente.schemas";
import {
  TextField, Button, Stack, Box, Paper,
  Typography, IconButton, Autocomplete, CircularProgress,
  Switch, FormControlLabel
} from "@mui/material";
import { collection, doc, getDoc, updateDoc, serverTimestamp, getDocs, deleteField } from "firebase/firestore";
import { db } from "../../firebase";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams, useNavigate } from "react-router-dom";
import { useAlert } from "../../shared/Alerts/AlertContext";
import { useQueryClient } from "@tanstack/react-query";

const initialContactState = {
  nombre: "",
  apellidos: "",
  puesto: "",
  email: "",
  telefono: "",
};

export const FormClientUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [currentContact, setCurrentContact] = useState(initialContactState);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ClienteSchema),
    defaultValues: {
      nombreEmpresa: "",
      direccionCompleta: "",
      giro: "",
      vertical: "",
      telefono: "", 
      clientesDeLaEmpresa: [],
      productosDeInteres: [],
      contactos: [],
      activo: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contactos",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const productSnapshot = await getDocs(collection(db, "productos"));
        setProductList(productSnapshot.docs.map(doc => doc.data().nombre));

        const clientSnapshot = await getDocs(collection(db, "Clientes"));
        setClientList(clientSnapshot.docs.map(doc => doc.data().nombreEmpresa));

        if (id) {
          const docRef = doc(db, "Clientes", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const clientData = docSnap.data();
            
            const clientes = clientData.clientesDeLaEmpresa || clientData.clientesQueSirve || {};

            reset({
              ...clientData,
              telefono: clientData.telefono || "", 
              // Carga los clientes encontrados
              clientesDeLaEmpresa: Object.keys(clientes), 
              productosDeInteres: Object.keys(clientData.productosInteres || {}),
              // Carga el estado activo (por defecto true si no existe)
              activo: clientData.activo !== undefined ? clientData.activo : true,
            });
          } else {
            showAlert('error', "Cliente no encontrado.");
            navigate("/clientes");
          }
        }
      } catch (error) {
        showAlert('error', "Error al cargar los datos.");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, navigate, reset, showAlert]);

  const onContactChange = (e) => {
    setCurrentContact((c) => ({ ...c, [e.target.name]: e.target.value }));
  };

  const handleAddContact = () => {
    if (!currentContact.nombre.trim() || !currentContact.email.trim()) {
      showAlert('warning', "El nombre y el email del contacto son obligatorios.");
      return;
    }
    append(currentContact);
    setCurrentContact(initialContactState);
  };

  const validatePhone = (phone) => /^[0-9]{8,10}$/.test(phone);

  const onSubmit = async (data) => {
    const badContacts = (data.contactos || []).filter(c => c.telefono && !validatePhone(c.telefono));

    setSaving(true);
    try {
      const productosInteresMap = data.productosDeInteres.reduce((map, producto) => ({ ...map, [producto]: true }), {});
      const clientesMap = data.clientesDeLaEmpresa.reduce((map, cliente) => ({ ...map, [cliente]: true }), {});
      
      const docRef = doc(db, "Clientes", id);
      await updateDoc(docRef, {
        ...data, 
        productosInteres: productosInteresMap, // Sobrescribe el array con el mapa
        
        clientesDeLaEmpresa: clientesMap, // Sobrescribe el array con el mapa
        
        clientesQueSirve: deleteField(), 
        
        // Guardar el estado activo
        activo: data.activo !== undefined ? data.activo : true,
        
        updatedAt: serverTimestamp(),
      });

      // Invalidar las queries para actualizar el dashboard y la lista de clientes
      await queryClient.invalidateQueries({ queryKey: ["clientesStatus"] });
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });

      showAlert('success', "El cliente ha sido actualizado correctamente.");
      navigate(`/clientes/${id}`);
    } catch (err) {
      console.error("Error actualizando cliente:", err);
      showAlert('error', "No se pudo actualizar el cliente. Revisa la consola.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>Editar Cliente</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Datos de la Empresa</Typography>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nombre de la Empresa"
              {...register("nombreEmpresa")}
              error={!!errors.nombreEmpresa}
              helperText={errors.nombreEmpresa?.message}
            />
            <TextField
              label="Dirección Completa"
              {...register("direccionCompleta")}
            />
            <TextField
              label="Giro de la Empresa"
              {...register("giro")}
            />
            <TextField
              label="Vertical"
              {...register("vertical")}
            />


            <TextField
              label="Teléfono (Empresa)"
              {...register("telefono")}
            />

            <Controller
              name="clientesDeLaEmpresa"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={clientList}
                  value={field.value} // RHF se encarga del valor
                  onChange={(event, newValue) => field.onChange(newValue)} // RHF se encarga del cambio
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Clientes de la Empresa"
                    />
                  )}
                />
              )}
            />
<Controller
  name="activo"
  control={control}
  render={({ field }) => {
    const isActive = field.value ?? true;

    return (
      <Box
        sx={{
          mt: 1,
          gridColumn: "1 / -0", // ocupa todo el ancho del grid
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderRadius: 1,
          border: "1px solid",

        }}
      >
        {/* Texto de estado */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Estado del cliente
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontWeight: 500,
              color: isActive ? "success.main" : "error.main",
            }}
          >
            {isActive ? "Cliente Activo" : "Cliente Inactivo"}
          </Typography>
        </Box>

        {/* Botón de proceso */}
        <Button
          variant="contained"
          color={isActive ? "error" : "success"}
          onClick={() => field.onChange(!isActive)}
        >
          {isActive ? "Desactivar cliente" : "Reactivar cliente"}
        </Button>
      </Box>
    );
  }}
/>

            <Controller
              name="productosDeInteres"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={productList}
                  value={field.value}
                  onChange={(event, newValue) => field.onChange(newValue)}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Productos de Interés"
                    />
                  )}
                />
              )}
            />
          </div>
        </Paper>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Contactos</Typography>
          {errors.contactos && <Typography color="error.main" sx={{ mb: 2 }}>{errors.contactos.message}</Typography>}
          <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', p: 2 }}>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <TextField label="Nombre(s)" name="nombre" value={currentContact.nombre} onChange={onContactChange} size="small"/>
              <TextField label="Apellidos" name="apellidos" value={currentContact.apellidos} onChange={onContactChange} size="small"/>
              <TextField label="Puesto" name="puesto" value={currentContact.puesto} onChange={onContactChange} size="small"/>
              <TextField label="Correo Electrónico" name="email" type="email" value={currentContact.email} onChange={onContactChange} size="small"/>
              <TextField label="Teléfono" name="telefono" value={currentContact.telefono} onChange={onContactChange} size="small"/>
            </div>
            <Button startIcon={<AddIcon />} onClick={handleAddContact} variant="outlined">Añadir Contacto</Button>
          </Box>
        </Paper>

        {fields.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Contactos a Guardar</Typography>
            {fields.map((contact, index) => (
              <Box key={contact.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #eee' }}>
                <Typography>{contact.nombre} {contact.apellidos} ({contact.email})</Typography>
                <IconButton onClick={() => remove(index)} color="error"><DeleteIcon /></IconButton>
              </Box>
            ))}
          </Paper>
        )}

<Stack
  direction="row"
  justifyContent="flex-start"
  sx={{ mb: 4 }}   // espacio debajo del botón
>
  <Button
    type="submit"
    variant="contained"
    disabled={saving}
    sx={{ bgcolor: "#7B2CBF", color: "white" }}
  >
    {saving ? "Guardando..." : "Guardar Cambios"}
  </Button>
</Stack>


      </form>
    </>
  );
};
