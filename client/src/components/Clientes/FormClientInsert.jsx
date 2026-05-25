import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  TextField, Button, Stack, Box, Paper,
  Typography, IconButton, Autocomplete
} from "@mui/material";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAlert } from "../../shared/Alerts/AlertContext";

const initialContactState = {
  nombre: "",
  apellidos: "",
  puesto: "",
  email: "",
  telefono: "",
};

const initialCompanyState = {
  nombreEmpresa: "",
  direccionCompleta: "",
  giro: "",
  vertical: "",
  telefono: "", // 
  clientesDeLaEmpresa: "", 
};

export const FormClientInsert = () => {
  const [form, setForm] = useState(initialCompanyState);
  
  const [productosDeInteres, setProductosDeInteres] = useState([]);
  const [clientesDeLaEmpresa, setClientesDeLaEmpresa] = useState([]);

  const [productList, setProductList] = useState([]);
  const [clientList, setClientList] = useState([]);

  const [currentContact, setCurrentContact] = useState(initialContactState);
  const [contactList, setContactList] = useState([]);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchInitialData = async () => {
      const productSnapshot = await getDocs(collection(db, "productos"));
      const products = productSnapshot.docs.map(doc => doc.data().nombre);
      setProductList(products);

      const clientSnapshot = await getDocs(collection(db, "Clientes"));
      setClientList(clientSnapshot.docs.map(doc => doc.data().nombreEmpresa));
    };
    fetchInitialData();
  }, []);

  const onCompanyChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onContactChange = (e) => {
    setCurrentContact((c) => ({ ...c, [e.target.name]: e.target.value }));
  };

  const handleAddContact = () => {
    if (!currentContact.nombre.trim() || !currentContact.email.trim()) {
      showAlert('warning', "El nombre y el email del contacto son obligatorios.");
      return;
    }
    setContactList([...contactList, currentContact]);
    setCurrentContact(initialContactState);
  };

  const handleRemoveContact = (indexToRemove) => {
    setContactList(contactList.filter((_, index) => index !== indexToRemove));
  };


  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombreEmpresa.trim()) {
      showAlert('warning', "El nombre de la empresa es obligatorio.");
      return;
    }
    if (contactList.length === 0) {
      showAlert('warning', "Debes agregar al menos un contacto.");
      return;
    }

    try {
      setSaving(true);
      const productosInteresMap = productosDeInteres.reduce((map, producto) => {
        map[producto] = true;
        return map;
      }, {});
      const clientesQueSirveMap = clientesDeLaEmpresa.reduce((map, cliente) => {
        map[cliente] = true;
        return map;
      }, {});
      
      
      await addDoc(collection(db, "Clientes"), {
        ...form, 
        contactos: contactList, 
        productosInteres: productosInteresMap,

        clientesDeLaEmpresa: clientesQueSirveMap, 
        activo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });


      await queryClient.invalidateQueries({ queryKey: ["clientes"] });

      showAlert('success', "El cliente ha sido agregado con éxito.");
      setForm(initialCompanyState);
      setContactList([]);
      setCurrentContact(initialContactState);
      setProductosDeInteres([]);
      setClientesDeLaEmpresa([]);
    } catch (err) {
      console.error("Error guardando cliente:", err);
      showAlert('error', "No se pudo guardar. Revisa la consola.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>Nuevo Cliente</Typography>
      <form onSubmit={onSubmit}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Datos de la Empresa</Typography>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Nombre de la Empresa" name="nombreEmpresa" value={form.nombreEmpresa} onChange={onCompanyChange} />
            <TextField label="Dirección Completa" name="direccionCompleta" value={form.direccionCompleta} onChange={onCompanyChange} />
            <TextField label="Giro de la Empresa" name="giro" value={form.giro} onChange={onCompanyChange} />
            <TextField label="Vertical" name="vertical" value={form.vertical} onChange={onCompanyChange} />


            <TextField 
              label="Teléfono (Empresa)" 
              name="telefono" 
              value={form.telefono} 
              onChange={onCompanyChange} 
            />
            
            <Autocomplete
              multiple
              options={clientList}
              value={clientesDeLaEmpresa}
              onChange={(event, newValue) => {
                setClientesDeLaEmpresa(newValue);
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Clientes de la Empresa"
                  placeholder="selecciona o escribe clientes"
                />
              )}
            />
            <Autocomplete
              multiple
              options={productList}
              value={productosDeInteres}
              onChange={(event, newValue) => {
                setProductosDeInteres(newValue);
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Productos de Interés"
                  placeholder="selecciona o escribe productos"
                />
              )}/>
          </div>
        </Paper>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Contactos</Typography>
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

        {contactList.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Contactos a Guardar</Typography>
            {contactList.map((contact, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #eee' }}>
                <Typography>{contact.nombre} {contact.apellidos} ({contact.email})</Typography>
                <IconButton onClick={() => handleRemoveContact(index)} color="error"><DeleteIcon /></IconButton>
              </Box>
            ))}
          </Paper>
        )}

        <Stack direction="row" justifyContent="flex-start">
          <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#7B2CBF", color: "white" }}>
            {saving ? "guardando..." : "guardar cliente y contactos"}
          </Button>
        </Stack>
      </form>
    </>
  );
};