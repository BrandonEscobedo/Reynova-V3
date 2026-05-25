import React, { useState, useEffect, useMemo } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Checkbox, IconButton, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import ProductList from './ProductList';
import { getCategorias, deleteCategoria, updateCategoria } from './services/categorias.services';
import EditCategoryModal from './EditCategoryModal';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAlert } from '../../shared/Alerts/AlertContext';

const CategoryAccordion = ({ products, filterByCategory = '', refreshTick = 0, selectedCategoryIds = [], onSelectionChange, onRefresh, deleteHandlerRef }) => {
  const [categories, setCategories] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategorias();
      setCategories(data);
    };
    fetchCategories();
  }, [refreshTick]);

  const visibleCategories = useMemo(() => {
    if (!filterByCategory) return categories;
    return categories.filter(c => c.nombre === filterByCategory);
  }, [categories, filterByCategory]);

  const handleToggleCategory = (categoryId, event) => {
    event.stopPropagation(); // Prevenir que se expanda/contraiga el acordeón
    if (onSelectionChange) {
      onSelectionChange('toggle', categoryId);
    }
  };

  const handleEdit = (category, event) => {
    event.stopPropagation(); // Prevenir que se expanda/contraiga el acordeón
    setEditingCategory(category);
    setEditModalOpen(true);
  };

  const handleUpdate = async (id, nuevoNombre) => {
    try {
      // Obtener la categoría actual para saber el nombre anterior
      const categoria = categories.find(c => c.id === id);
      const nombreAnterior = categoria?.nombre;

      if (!nombreAnterior) {
        showAlert('error', 'No se pudo encontrar la categoría.');
        return;
      }

      // Actualizar la categoría
      await updateCategoria(id, nuevoNombre);

      // Actualizar todos los productos que tienen esta categoría
      if (nombreAnterior !== nuevoNombre) {
        const productosRef = collection(db, 'productos');
        const q = query(productosRef, where('categoria', '==', nombreAnterior));
        const querySnapshot = await getDocs(q);
        
        const updatePromises = [];
        querySnapshot.forEach((productDoc) => {
          updatePromises.push(
            updateDoc(doc(db, 'productos', productDoc.id), {
              categoria: nuevoNombre
            })
          );
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }

      const updatedCategories = await getCategorias();
      setCategories(updatedCategories);
      if (onRefresh) await onRefresh();
      showAlert('success', 'Categoría y productos asociados actualizados correctamente.');
    } catch (error) {
      console.error('Error al actualizar la categoría:', error);
      showAlert('error', 'Error al actualizar la categoría.');
    }
  };

  const handleDeleteClick = () => {
    if (selectedCategoryIds.length === 0) {
      showAlert('warning', 'Por favor selecciona al menos una categoría para eliminar.');
      return;
    }
    setConfirmVisible(true);
  };

  const performDelete = async () => {
    if (selectedCategoryIds.length === 0) return;
    
    // Verificar que ninguna categoría tenga productos
    const categoriesToDelete = categories.filter(c => selectedCategoryIds.includes(c.id));
    const categoriesWithProducts = categoriesToDelete.filter(cat => 
      products.some(p => p.categoria === cat.nombre)
    );

    if (categoriesWithProducts.length > 0) {
      const names = categoriesWithProducts.map(c => c.nombre).join(', ');
      showAlert('warning', `No se pueden eliminar las siguientes categorías porque tienen productos asociados: ${names}`);
      setConfirmVisible(false);
      if (onSelectionChange) onSelectionChange('clear');
      return;
    }

    // Eliminar todas las categorías seleccionadas
    try {
      await Promise.all(selectedCategoryIds.map(id => deleteCategoria(id)));
      setConfirmVisible(false);
      if (onSelectionChange) onSelectionChange('clear');
      const updatedCategories = await getCategorias();
      setCategories(updatedCategories);
      if (onRefresh) await onRefresh();
      showAlert('success', selectedCategoryIds.length === 1 
        ? 'Categoría eliminada correctamente.' 
        : `${selectedCategoryIds.length} categorías eliminadas correctamente.`);
    } catch (error) {
      showAlert('error', 'Error al eliminar las categorías.');
    }
  };

  // Exponer la función de eliminación usando ref
  useEffect(() => {
    if (deleteHandlerRef) {
      deleteHandlerRef.current = handleDeleteClick;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds, categories, products]);

  return (
    <>
      <div>
        {visibleCategories.map((category) => (
          <Accordion
            key={category.id}
            sx={{
              border: '1px solid #1e3a8a',
              borderRadius: 1,
              mb: 1.5,
              bgcolor: '#f8fafc',
              '&:before': { display: 'none' },
              boxShadow: 'none',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${category.id}-content`}
              id={`panel-${category.id}-header`}
              sx={{
                borderBottom: '1px solid #1e3a8a',
                bgcolor: '#eef2ff',
                '& .MuiTypography-root': { fontWeight: 600, color: '#1e3a8a' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Checkbox
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={(e) => handleToggleCategory(category.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ p: 0.5 }}
                />
                <Typography sx={{ flexGrow: 1 }}>{category.nombre}</Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleEdit(category, e)}
                  sx={{ 
                    p: 0.5,
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: '#ffffff' }}>
              <ProductList
                products={products.filter(p => p.categoria === category.nombre)}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </div>

      {confirmVisible && (
        <div className="flex items-center justify-between gap-4 p-3 mt-2 rounded-lg border border-red-200 bg-red-50">
          <span className="text-sm md:text-base text-red-800">
            ¿Desea eliminar {selectedCategoryIds.length === 1 
              ? `la categoría "${categories.find(c => c.id === selectedCategoryIds[0])?.nombre || ''}"?`
              : `las ${selectedCategoryIds.length} categorías seleccionadas?`}
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

      <EditCategoryModal
        open={editModalOpen}
        handleClose={() => {
          setEditModalOpen(false);
          setEditingCategory(null);
        }}
        handleUpdate={handleUpdate}
        category={editingCategory}
      />
    </>
  );
};

export default CategoryAccordion;
