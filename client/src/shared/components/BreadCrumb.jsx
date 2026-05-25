import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Cambiado a react-router-dom
import { ChevronRight, Home } from 'lucide-react';

export const BreadCrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // palabras que no queremos que sean enlaces
  const nonLinkablePaths = ['Editar', 'Nuevo'];

  const formatLabel = (str) => {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <Link 
        to="/" 
        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // --- inicio ---
        // para que editar no sea un enlace y muestre pantalla en blanco
        const isNonLinkable = nonLinkablePaths.includes(formatLabel(name)) || isLast;
        
        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {isNonLinkable ? (
              <span className="text-gray-900 font-medium">
                {formatLabel(name)}
              </span>
            ) : (
              <Link 
                to={routeTo}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                {formatLabel(name)}
              </Link>
            )}
          </React.Fragment>
        );
        // --- fin ---
      })}
    </nav>
  );
};
