# Persistencia de subastas en Vercel

## Estado

Preparado en el repositorio local. El almacén privado `anomaly-auctions` está creado en la región `gru1` y conectado al proyecto `anomaly-team`; `BLOB_READ_WRITE_TOKEN` está limitado a Production. El código de persistencia aún no se ha subido ni desplegado. La web publicada todavía utiliza `/tmp`.

## Diseño

- Un Blob privado en `anomaly-team/auctions.json` contiene la lista completa de subastas. El navegador nunca recibe el token ni una URL privada.
- Cada lectura usa `useCache: false` para ver la última escritura. Cada cambio usa el ETag anterior y reintenta conflictos de versión. Los fallos de lectura o escritura no se sustituyen por datos temporales.
- Las dos entradas de ejemplo actuales aparecen mientras el Blob no existe y se conservan en la primera escritura. Una lista vacía guardada sigue vacía.
- La copia local `data/auctions_db.json` sigue siendo el entorno de desarrollo. La subasta local Hurricane Armor permanece allí hasta su publicación explícita.

## Activación pendiente

1. El 9 de noviembre se comprobó el almacén real con archivos aislados: alta, lectura, dos cambios simultáneos, lista vacía, rutas HTTP de alta/puja/edición/venta/borrado y eliminación de los archivos de prueba. También se creó un anuncio temporal en Subastas, se actualizó el mismo mensaje con puja, edición, venta y aviso de vendido, y se eliminó. No se tocaron subastas reales.
2. Revisar los resultados y pedir autorización para subir el commit a GitHub y desplegarlo. Confirmar en producción que el token está presente y que las dos entradas de ejemplo se muestran.
3. Publicar Hurricane Armor desde los datos locales solo una vez, verificar su `discord_message_id`, consultar la API de producción después de una ejecución nueva y comprobar el anuncio de Discord.

## Capacidad y costos

Vercel muestra para Hobby una inclusión mensual de 1 GB de Blob Storage, 10.000 operaciones simples, 2.000 operaciones avanzadas y 10 GB de transferencia Blob. El plan Hobby no compra uso adicional al superar sus límites. Cada lectura sin caché puede sumar transferencia desde origen. La captura de pantalla de una subasta se guarda en el JSON y aumenta el tamaño completo reescrito en cada puja. Hay que consultar la página de precios y el plan de la cuenta justo antes de crear el store.

Esta solución conviene para pocas subastas y pujas. Si el volumen crece, conviene pasar a una base de datos transaccional; no hay migración automática a otro proveedor.

## Riesgos conocidos

- Blob no crea una transacción distribuida con Discord. El alta compensa un fallo de guardado intentando retirar su anuncio; las ediciones y pujas guardan primero y después actualizan Discord. Un fallo de Discord puede dejar una actualización pendiente de sincronizar, como ya ocurría antes.
- Un fallo de red después de que Blob acepte una escritura puede dejar un resultado incierto. Antes de reintentar manualmente, consultar el estado por ID para evitar duplicados.
- El archivo JSON completo se lee y escribe por cambio; las opciones de caché y concurrencia incrementan operaciones y latencia.
