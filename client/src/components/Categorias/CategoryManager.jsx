import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateCategoryModal from './CreateCategoryModal';
import { createCategoria, getCategorias } from './services/categorias.services';
import { useAlert } from '../../shared/Alerts/AlertContext';
import { RefreshCcw } from 'lucide-react';

const CategoryManager = ({ onRefresh, products = [], onFilterChange, selectedCategoryIds = [], onSelectionChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const { showAlert } = useAlert();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCategories = async () => {
    const data = await getCategorias();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (name) => {
    await createCategoria(name);
    await loadCategories();
    await onRefresh(); 
    if (onFilterChange) onFilterChange(''); // limpiar filtro tras crear
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadCategories();
      await onRefresh();
      showAlert('info', 'Lista actualizada.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
          Crear Categoría
        </Button>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="select-categoria-label">Selecciona categoría</InputLabel>
          <Select
            labelId="select-categoria-label"
            id="select-categoria"
            value={selectedCategoryId}
            label="Selecciona categoría"
            onChange={(e) => {
              const id = e.target.value;
              setSelectedCategoryId(id);
              if (id === '') {
                if (onFilterChange) onFilterChange('');
              } else {
                const found = categories.find(c => c.id === id);
                if (onFilterChange) onFilterChange(found?.nombre || '');
              }
            }}
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          color={selectedCategoryIds.length > 0 ? "error" : "inherit"}
          startIcon={<DeleteIcon />}
          disabled={selectedCategoryIds.length === 0}
          onClick={() => {
            if (onSelectionChange && selectedCategoryIds.length > 0) {
              // La lógica de eliminación se manejará en el componente padre xd
              onSelectionChange('delete');
            }
          }}
          sx={{
            ...(selectedCategoryIds.length === 0 && {
              color: 'text.disabled',
              borderColor: 'action.disabled',
            }),
          }}
        >
          Eliminar{selectedCategoryIds.length > 0 ? ` (${selectedCategoryIds.length})` : ''}
        </Button>
        <div
          onClick={handleRefresh}
          className="p-2 border rounded-xl border-blue-700 cursor-pointer"
        >
          <RefreshCcw
            className={`transition-transform duration-300 ${
              isRefreshing ? 'animate-spin text-blue-700' : 'hover:rotate-180'
            }`}
            size={24}
          />
        </div>
      </Box>
      <CreateCategoryModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        handleCreate={handleCreate}
      />
    </>
  );
};

export default CategoryManager;
