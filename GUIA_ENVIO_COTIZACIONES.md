# Guía: Envío de Cotizaciones por Correo

## Arquitectura

La solución consta de tres partes:

1. **Cloud Function** (`cloudFunctions/functions/enviarCotizacionPorCorreo.js`)
   - Recibe: `cotizacionId` y `emailDestinatario`
   - Obtiene los datos de Firestore
   - Llama al webhook de Make (Make.com)
   - Registra en Firestore: `emailEnviadoAt`, `emailDestinatario`, `emailStatus`

2. **Cliente Service**
   (`client/src/components/Clientes/Cotizaciones/services/cotizaciones.services.js`)
   - Método: `enviarCotizacionPorCorreo(cotizacionId, emailDestinatario)`
   - Llama la Cloud Function desde el cliente

3. **Hook React**
   (`client/src/components/Clientes/Cotizaciones/hooks/useCotizaciones.js`)
   - Exporta `enviarCotizacion` para usar en componentes
   - Maneja estado de carga y errores

4. **Modal UI**
   (`client/src/components/Clientes/Cotizaciones/components/EnviarCotizacionModal.jsx`)
   - Componente listo para usar
   - Valida email
   - Muestra feedback al usuario

## Webhook de Make

El webhook espera este payload:

```json
{
    "cotizacionId": "abc123",
    "emailDestinatario": "cliente@empresa.com",
    "nombreCliente": "Mi Empresa",
    "tituloCotizacion": "Cotización 2025",
    "total": 5000,
    "productos": [
        {
            "nombre": "Producto A",
            "cantidad": 2,
            "precioUnitario": 500,
            "subtotal": 1000
        }
    ],
    "metodoPago": "Crédito",
    "status": "pendiente",
    "fechaEntrega": "2025-05-25",
    "linkPublico": "https://reynova.com/cotizacion/abc123",
    "timestamp": "2025-05-12T10:30:00.000Z"
}
```

## Cómo Usar

### Opción 1: Modal (Recomendado)

```jsx
import { useState } from "react";
import EnviarCotizacionModal from "../components/EnviarCotizacionModal";
import { useAlert } from "../../../../shared/Alerts/AlertContext";

export default function MiComponente() {
    const [openModal, setOpenModal] = useState(false);
    const [cotizacionId, setCotizacionId] = useState("");
    const { showAlert } = useAlert();

    const handleOpenModal = (id) => {
        setCotizacionId(id);
        setOpenModal(true);
    };

    return (
        <>
            <button onClick={() => handleOpenModal("123")}>
                Enviar por Correo
            </button>

            <EnviarCotizacionModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                cotizacionId={cotizacionId}
                onSuccess={(msg) => showAlert("success", msg)}
            />
        </>
    );
}
```

### Opción 2: Directamente desde el Hook

```jsx
import { useCotizaciones } from "../hooks/useCotizaciones";

export default function OtroComponente() {
    const { enviarCotizacion, loading, error } = useCotizaciones();

    const handleEnviar = async () => {
        try {
            const resultado = await enviarCotizacion(
                "cotizacion-id",
                "email@empresa.com",
            );
            console.log("Éxito:", resultado);
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <button onClick={handleEnviar} disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
        </button>
    );
}
```

## Despliegue

1. Deploy de Cloud Function:

```bash
cd cloudFunctions
firebase deploy --only functions:enviarCotizacionPorCorreo
```

2. El cliente automáticamente usará la nueva función una vez desplegada.

## Configuración en Make.com

En Make.com necesitas:

1. Crear un webhook (ya tienes la URL)
2. El webhook recibirá el JSON con los datos
3. Usa Scenario de Make para:
   - Parsear el JSON
   - Enviar correo (usar módulo Email o Gmail)
   - Registrar en DB si es necesario

## Campos que se guardan en Firestore

Después de enviar, la cotización se actualiza con:

```javascript
{
  "emailEnviadoAt": Timestamp,
  "emailDestinatario": "cliente@empresa.com",
  "emailStatus": "enviado"
}
```

Esto permite:

- Evitar reenvíos duplicados
- Auditar quién recibió qué
- Rastrear el historial

## Limitaciones y Notas

- El webhook debe responder en menos de 60 segundos
- Si Make está down, la función lanzará error
- Los contactos se obtienen de la colección "Clientes"
- La cotización debe existir en Firestore

## Troubleshooting

**Error: "La cotización no existe"** → Verifica que el `cotizacionId` es válido

**Error: "Faltan parámetros requeridos"** → Asegúrate de pasar `cotizacionId` y
`emailDestinatario`

**No se envía el correo pero la función retorna éxito** → Revisa los logs de
Make.com, el error está en el webhook, no en la función

**CORS Error** → Los CORS se manejan automáticamente porque usamos
`httpsCallable` de Firebase
