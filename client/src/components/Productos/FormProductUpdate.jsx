import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductoSchema } from "./schemas/producto.schemas";
import {
  TextField,
  Button,
  Stack,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { useAlert } from "../../shared/Alerts/AlertContext";
import { getCategorias } from "../Categorias/services/categorias.services";
import { useQueryClient } from "@tanstack/react-query";

export const FormProductUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState(null); 
  const [categories, setCategories] = useState([]);
  
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(ProductoSchema),
    // 1. AÑADIMOS LOS NUEVOS CAMPOS A LOS VALORES POR DEFECTO
    defaultValues: {
      nombre: "",
      modelo: "",
      categoria: "",
      precio: 0,
      costo_adquisicion: 0, 
      stock: 0, 
      descripcion: "",
    },
  });

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        const categoriesData = await getCategorias();
        setCategories(categoriesData);

        const docRef = doc(db, "productos", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = docSnap.data();
          setOriginalData(productData); 
          // Al llamar a reset() con productData, React Hook Form 
          // llenará el stock y el costo automáticamente.
          reset(productData); 
        } else {
          showAlert("error", "el producto no existe.");
          navigate("/productos");
        }
      } catch (error) {
        showAlert("error", "error al cargar los datos.");
        console.error("error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndCategories();
  }, [id, navigate, reset, showAlert]);

  const onSubmit = handleSubmit(async (datos) => {
    try {
      const docRef = doc(db, "productos", id);
      const updatedData = { ...datos, updatedAt: serverTimestamp() };

      if (Number(datos.precio) !== Number(originalData.precio)) {
        
        const nuevoRegistroHistorial = {
          fecha: new Date(),
          precio: datos.precio,
        };
        updatedData.historialPrecioVenta = arrayUnion(nuevoRegistroHistorial);
      }

      await updateDoc(docRef, updatedData);

      await queryClient.invalidateQueries({ queryKey: ["productos"] });

      showAlert("success", "El producto ha sido actualizado correctamente.");
      navigate(`/productos/${id}`); 
    } catch (err) {
      console.error("error actualizando producto:", err);
      showAlert("error", `No se pudo actualizar: ${err.message}`);
    }
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Editar Producto
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
                defaultValue={originalData?.categoria || ""}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>}
            </FormControl>
            
            <TextField
              label="Precio de Venta"
              type="number"
              {...register("precio")}
              error={!!errors.precio}
              helperText={errors.precio?.message}
              InputProps={{ step: "0.01" }}
            />

            {/* 2. AÑADIMOS LOS NUEVOS INPUTS VISUALES */}
            <TextField
              label="Costo de Adquisición"
              type="number"
              {...register("costo_adquisicion")}
              error={!!errors.costo_adquisicion}
              helperText={errors.costo_adquisicion?.message}
              InputProps={{ step: "0.01" }} 
            />
            
            <TextField
              label="Stock Físico Actual"
              type="number"
              {...register("stock")}
              error={!!errors.stock}
              helperText={errors.stock?.message}
              InputProps={{ step: "1" }} 
            />
            {/* -------------------------------------- */}

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
            {isSubmitting ? "guardando..." : "guardar cambios"}
          </Button>
        </Stack>
      </form>
    </>
  );
};