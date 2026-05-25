import React from 'react';
import { List, ListItem, ListItemText, Typography, Divider } from '@mui/material';

const ProductList = ({ products }) => {
  return (
    <>
      {products.length > 0 ? (
        <List>
          {products.map((product, index) => (
            <React.Fragment key={product.id}>
              <ListItem>
                <ListItemText primary={product.nombre} />
                <Typography variant="body2" color="text.secondary">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.precio)}
                </Typography>
              </ListItem>
              {index < products.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography sx={{ p: 2, textAlign: 'center' }}>
          No hay productos en esta categoría.
        </Typography>
      )}
    </>
  );
};

export default ProductList;
