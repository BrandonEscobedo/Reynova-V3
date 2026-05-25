import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form"; 
import { zodResolver } from "@hookform/resolvers/zod"; 
import { ProductoSchema } from "./schemas/producto.schemas"; 
import { TextField, Button, Stack, Paper, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "../../firebase";
import { useAlert } from "../../shared/Alerts/AlertContext";
import { getCategorias } from "../Categorias/services/categorias.services";

export const FormProductInsert = () => {
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState([]);
  
  // Inicializar queryClient
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategorias();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }, 
    reset,
  } = useForm({
    resolver: zodResolver(ProductoSchema),
  });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      // serverTimestamp() marca error al guardar en el array
      const historialInicial = [{
        fecha: new Date(), // usamos este
        precio: datos.precio, 
      }];

      await addDoc(collection(db, "productos"), {
        ...datos,
        historialPrecioVenta: historialInicial, 
        productosVendidos: 0, // contador de ventas 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Avisar al caché que hay datos nuevos
      await queryClient.invalidateQueries({ queryKey: ["productos"] });

      showAlert('success', "Se ha guardado el producto correctamente.");
      reset(); 

    } catch (err) {
      console.error("error guardando producto:", err);
      showAlert('error', `No se pudo guardar: ${err.message}`);
    }
  });

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Nuevo Producto
      </Typography>

      <form onSubmit={onSubmit}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Datos del Producto
          </Typography>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nombre del Producto"
              {...register("nombre")}
              error={!!errors.nombre} 
              helperText={errors.nombre?.message} 
            />
            <TextField
              label="Modelo"
              {...register("modelo")}
              error={!!errors.modelo}
              helperText={errors.modelo?.message}
            />
            <FormControl fullWidth error={!!errors.categoria}>
              <InputLabel id="category-select-label">Categoría</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                label="Categoría"
                {...register("categoria")}
                defaultValue=""
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>}
            </FormControl>
            
            {/* Se agrupa el precio con los datos financieros */}
            <TextField
              label="Precio de Venta"
              type="number"
              {...register("precio")}
              error={!!errors.precio}
              helperText={errors.precio?.message}
              InputProps={{ step: "0.01" }} 
            />

            {/* Dos Nuevos Inputs */}
            <TextField
              label="Costo de Adquisición"
              type="number"
              {...register("costo_adquisicion")}
              error={!!errors.costo_adquisicion}
              helperText={errors.costo_adquisicion?.message}
              InputProps={{ step: "0.01" }} 
            />
            
            <TextField
              label="Stock Inicial"
              type="number"
              {...register("stock")}
              error={!!errors.stock}
              helperText={errors.stock?.message}
              InputProps={{ step: "1" }} 
            />
            {/* ------ */}

            <TextField
              label="Descripción"
              {...register("descripcion")}
              error={!!errors.descripcion}
              helperText={errors.descripcion?.message}
              multiline
              rows={4}
              className="col-span-2"
            />
          </div>
        </Paper>

        <Stack direction="row" justifyContent="flex-start">
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting} 
            sx={{ bgcolor: "#7B2CBF", color: "white" }}
          >
            {isSubmitting ? "guardando..." : "guardar producto"}
          </Button>
        </Stack>
      </form>
    </>
  );
};