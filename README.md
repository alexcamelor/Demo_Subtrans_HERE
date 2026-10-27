# Demo Subtrans · páginas web para Experience Builder

Dos páginas estáticas que se publican en GitHub Pages y se incrustan con el widget **Insertar (Embed)** de Experience Builder.

| Página | Para qué | APIs |
|---|---|---|
| `index.html` | Rutas, isócronas, matriz OD, búsqueda y tráfico en vivo | HERE Routing v8, Isoline v8, Matrix v8, Geocoding & Search v7, Traffic v7, Raster Tile v3 |
| `exceso.html` | Consulta de conteos por tramo de exceso de velocidad y tramo horario (punto 1.3.3 del pliego) | Capa `Tramos_Velocidad` en ArcGIS Online (HERE GIS Data Suite) + HERE Routing v8 de respaldo |

## Las llaves no van en el repositorio

Las páginas leen las llaves desde la dirección, después de `#`. Lo que va después de `#` no se envía a GitHub ni queda en el código. La URL completa se pega en el widget Insertar del Experience Builder, que solo ven los usuarios que inician sesión.

### index.html

```
https://TU_USUARIO.github.io/geoservicio-here/#k=API_KEY_HERE
```

Opcionales: `&tabs=ruta,iso` (solo esas pestañas: `ruta`, `iso`, `matriz`, `buscar`, `trafico`) · `&tab=trafico` · `&lat=-33.45&lng=-70.65&z=13` · `&bm=explore.night` · `&title=Texto`.

### exceso.html

```
https://TU_USUARIO.github.io/geoservicio-here/exceso.html#k=API_KEY_HERE&fl=URL_CAPA&ak=API_KEY_ARCGIS
```

- `dk` (recomendado): clave para abrir `tramos_demo.bin`, la red de tramos HGDS con siniestralidad, cifrada con AES-GCM. El archivo va en el repositorio, pero sin la clave no se puede leer. No necesita ArcGIS Online ni API keys.
- `fl`: URL de la capa `Tramos_Velocidad` en ArcGIS Online, terminada en `/FeatureServer/N` (alternativa a `dk`).
- `ak`: API key de ArcGIS con acceso de solo lectura a esa capa (Contenido → Nuevo ítem → Credenciales de desarrollador → Credenciales de clave de API).
- Sin `fl`, la página usa HERE Routing para ubicar los puntos. En ese modo no hay dato de pistas ni de comuna.

Funcionalidades del pliego que cubre `exceso.html`:

| N.º | Funcionalidad | Cómo |
|---|---|---|
| 1 | Ubicación por coordenadas, sentido e ID punto | Formulario individual; búsqueda adicional por vía, ruta, comuna, región o ID de tramo |
| 2 | Meses (consecutivos o no) y tramos horarios de 1 a 24 h | Grilla de meses 2021 → último mes cerrado; duración fija o rangos personalizados |
| 3 | Tramos de exceso libres y límite editable | Tabla editable, tramos bajo y sobre el límite; límite por ubicación sin alterar la base |
| 4 | XLSX, KML, CSV, GeoJSON y Shapefile con la estructura del pliego | Columnas en el orden exigido, más ID tramo, comuna y región |
| 5 | Validación de la consulta | Coordenadas, sentido sin vía coincidente, punto lejos de la vía, límite faltante, rangos superpuestos |
| 6 | Consulta masiva | Archivo XLSX, CSV, GeoJSON, KML o Shapefile .zip, o filas pegadas (hasta 200 ubicaciones) |
| 7 | Nombre de archivo con ID y marca de tiempo | `CONASET_ExcesoVel_<ID>_<aaaammdd_hhmmss>.<ext>` |
| 8 | Aviso de tiempo de procesamiento | Consulta rápida (≤ 100.000 registros) o masiva, con estimación y correo de aviso (simulado) |
| 9 | Historial con re-descarga y eliminación por 1 año | Historial en el navegador; la re-descarga regenera exactamente el mismo archivo |
| Opc. 1 | Cantidad de pistas | Pistas por sentido de HERE GIS Data Suite |
| Opc. 2 | Tipo de vehículo | Livianos, buses y camiones |

**Nota del demo:** los conteos y las distribuciones de velocidad son simulados a partir de los patrones históricos de velocidad HERE de cada tramo. En el servicio contratado provienen de HERE Traffic Analytics.

## Publicar en GitHub Pages

1. Crea un repositorio público y sube `index.html`, `exceso.html`, `tramos_demo.bin`, `xlsx.full.min.js`, `jszip.min.js` y este `README.md`. Las dos librerías (SheetJS y JSZip) van junto a la página para no depender de CDN externos.
2. *Settings → Pages → Source: Deploy from a branch → main / (root) → Save*.
3. En 1 o 2 minutos queda en `https://TU_USUARIO.github.io/geoservicio-here/`.
