# 🧪 Scripts de Prueba y Verificación

Esta carpeta contiene scripts para probar y verificar que todo el sistema funciona correctamente.

## 📋 Scripts Disponibles

### 🚀 Test de APIs

#### `test-apis.js` (Node.js - Recomendado)

```bash
# Ejecutar con Node.js
pnpm run test:apis

# O directamente
node scripts/test-apis.js

# Con URL personalizada
BASE_URL=http://localhost:4321 node scripts/test-apis.js
```

**Prueba:**

- ✅ Home redirect
- ✅ API: Get available slots
- ✅ API: Get properties
- ✅ API: Get EasyBroker properties
- ✅ API: Create appointment
- ✅ API: Check slot
- ✅ API: CRM appointments list
- ✅ API: Auth check session

#### `test-apis.sh` (Bash)

```bash
# Ejecutar con bash
pnpm run test:apis:sh

# O directamente
bash scripts/test-apis.sh

# Con URL personalizada
BASE_URL=http://localhost:4321 bash scripts/test-apis.sh
```

### 🏥 Health Check

```bash
# Ejecutar health check completo
pnpm run health-check

# O directamente
node scripts/health-check.js
```

**Verifica:**

- ✅ Rutas básicas
- ✅ APIs principales
- ✅ Servicios unificados
- ✅ Estructura de páginas
- ✅ Disponibilidad de datos

### 🗄️ SQL de Verificación

#### `test-database.sql`

Ejecuta estos queries en el **Supabase SQL Editor** para verificar la base de datos:

**Incluye:**

- ✅ Verificación de estructura de tablas
- ✅ Conteo de registros
- ✅ Verificación de slots disponibles
- ✅ Verificación de citas
- ✅ Integridad de datos
- ✅ Estadísticas generales
- ✅ Verificación de RLS

**Cómo usar:**

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `test-database.sql`
4. Ejecuta los queries

#### `setup-test-data.sql`

Crea datos de prueba en la base de datos.

**⚠️ ADVERTENCIA:** Solo usar en desarrollo.

**Crea:**

- ✅ Agente de prueba
- ✅ Slots de disponibilidad (próximos 7 días)
- ✅ Cliente de prueba
- ✅ Propiedad de prueba
- ✅ Cita de prueba

**Cómo usar:**

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `setup-test-data.sql`
4. Ejecuta el script
5. Verifica los datos creados

## 🎯 Flujo de Prueba Recomendado

### 1. Setup Inicial

```bash
# 1. Crear datos de prueba en Supabase
# Ejecuta setup-test-data.sql en Supabase SQL Editor
```

### 2. Health Check

```bash
# 2. Verificar que todo funciona
pnpm run health-check
```

### 3. Test de APIs

```bash
# 3. Probar todas las APIs
pnpm run test:apis
```

### 4. Verificación de Base de Datos

```bash
# 4. Ejecutar queries de verificación en Supabase
# Abre test-database.sql en Supabase SQL Editor
```

## 📊 Interpretación de Resultados

### Health Check

- **✅ Passed**: Componente funcionando correctamente
- **✗ Failed**: Componente con problemas
- **⚠ Warnings**: Advertencias (no crítico)

### Test de APIs

- **✓ PASSED**: API respondió correctamente
- **✗ FAILED**: API falló o respondió incorrectamente
- **⚠ SKIPPED**: Prueba omitida (normal en algunos casos)

## 🔧 Troubleshooting

### Si las pruebas fallan:

1. **Verificar que el servidor está corriendo:**

   ```bash
   pnpm run dev
   ```

2. **Verificar variables de entorno:**

   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Verificar base de datos:**

   - Ejecutar `setup-test-data.sql` si no hay datos
   - Verificar conexión a Supabase

4. **Verificar logs del servidor:**
   - Revisar consola del servidor Astro
   - Revisar logs de Supabase

## 📝 Notas

- Los scripts asumen que el servidor está corriendo en `http://localhost:4321`
- Puedes cambiar la URL con la variable de entorno `BASE_URL`
- Los scripts SQL deben ejecutarse en Supabase SQL Editor
- Los datos de prueba se pueden eliminar manualmente desde Supabase Dashboard
