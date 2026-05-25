import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import CategoryManager from './CategoryManager';
import { useProductos } from '../Productos/hooks/useProducts';
import CategoryAccordion from './CategoryAccordion';

const CategoriasPage = () => {
  const { productos, isLoading, error, refetch } = useProductos();
  const [refreshTick, setRefreshTick] = useState(0);
  const [filterCategoryName, setFilterCategoryName] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const deleteHandlerRef = useRef(null);

  const handleRefreshAll = async () => {
    await refetch();
    setRefreshTick((t) => t + 1);
  };

  const handleSelectionChange = (action, categoryId) => {
    if (action === 'toggle') {
      setSelectedCategoryIds(prev => 
        prev.includes(categoryId)
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    } else if (action === 'clear') {
      setSelectedCategoryIds([]);
    } else if (action === 'delete') {
      // Llamar a la función de eliminación desde CategoryAccordion
      if (deleteHandlerRef.current) {
        deleteHandlerRef.current();
      }
    }
  };

  if (isLoading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="bold">
        Categorías
      </Typography>
      <CategoryManager
        onRefresh={handleRefreshAll}
        products={productos}
        onFilterChange={setFilterCategoryName}
        selectedCategoryIds={selectedCategoryIds}
        onSelectionChange={handleSelectionChange}
      />
      <CategoryAccordion
        products={productos}
        filterByCategory={filterCategoryName}
        refreshTick={refreshTick}
        selectedCategoryIds={selectedCategoryIds}
        onSelectionChange={handleSelectionChange}
        onRefresh={handleRefreshAll}
        deleteHandlerRef={deleteHandlerRef}
      />
    </Box>
  );
};

export default CategoriasPage;
