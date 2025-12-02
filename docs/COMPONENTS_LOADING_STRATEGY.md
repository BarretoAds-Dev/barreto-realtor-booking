# ⚡ Estrategia de Carga de Componentes - Islands Architecture

## 📋 Matriz de Decisión de Directivas Client

### 🎯 Componentes Principales (Nivel 1)

| Componente | Directiva | Razón | Caso de Uso | Ubicación |
|------------|-----------|-------|-------------|-----------|
| `LoginForm.tsx` | `client:load` | Contenido principal, interacción inmediata esperada | Página `/login` | `src/pages/login.astro` |
| `AppointmentForm.tsx` | `client:visible` | Formulario complejo, puede estar después de scroll | Página `/citas` | Dentro de `BookingPublic` |
| `AppointmentFormFields.tsx` | `client:visible` | Formulario complejo, carga cuando entra en viewport | Dentro de `AppointmentForm` | `src/components/ui/` |
| `BookingPublic.tsx` | `client:visible` | Formulario de reservas, below-the-fold | Página `/citas` | `src/2-app-crm/1-BookingForm/` |
| `CRMDashboardComponent` | `client:load` | Dashboard principal, interactividad inmediata | Página `/crm` | `src/pages/crm/crmdashboard.astro` |
| `PropertiesDashboard` | `client:idle` | Componente pesado, no crítico | Página `/propiedades` | `src/pages/propiedades/index.astro` |

### 🔧 Componentes UI (Nivel 2 - Sin Directivas)

**Nota:** Los componentes UI no tienen directivas porque se cargan con su componente padre. La directiva se aplica al componente contenedor.

| Componente | Tipo | Razón | Uso |
|------------|------|-------|-----|
| `Button.tsx` | TSX Interactivo | Estado de loading, onClick handlers | Botones primarios y secundarios |
| `Input.tsx` | TSX Interactivo | Validación en tiempo real, onBlur | Campos de formulario |
| `Select.tsx` | TSX Interactivo | Validación en tiempo real, onChange | Selects críticos del flujo |
| `Radio.tsx` | TSX Interactivo | Estado reactivo de selección | Decisiones críticas (rentar/comprar) |
| `Textarea.tsx` | TSX Interactivo | Validación en tiempo real | Comentarios, descripciones |
| `FormField.tsx` | TSX Estático | Wrapper sin estado, renderizado puro | Wrapper de campos |
| `ErrorMessage.tsx` | TSX Estático | Mensajes de error, renderizado puro | Mensajes de error |

### 📊 Estrategia por Contexto de Uso

#### 1. Formularios de Login (Crítico)
```astro
<!-- Login: Carga inmediata -->
<LoginForm client:load />
```
**Razón:** El usuario espera interactividad inmediata al llegar a la página de login.

#### 2. Formularios de Citas (Below-the-Fold)
```astro
<!-- Booking: Carga cuando entra en viewport -->
<BookingPublic client:visible />
  <!-- Dentro: AppointmentForm con client:visible -->
  <!-- Dentro: AppointmentFormFields con client:visible -->
```
**Razón:** El formulario puede estar después del scroll inicial. Optimiza FCP.

#### 3. Dashboards (Crítico vs Pesado)
```astro
<!-- Dashboard CRM: Interactividad inmediata -->
<CRMDashboardComponent client:load />

<!-- Dashboard Propiedades: Componente pesado -->
<PropertiesDashboard client:idle />
```
**Razón:**
- CRM Dashboard: Interactividad crítica para usuarios autenticados
- Properties Dashboard: Muchas propiedades, carga cuando el navegador está idle

### 🎨 Componentes UI: Contexto de Uso

Los componentes UI (`Button`, `Input`, `Select`, `Radio`, `Textarea`) se cargan automáticamente cuando se carga su componente padre. No necesitan directivas individuales.

**Ejemplo:**
```tsx
// AppointmentForm.tsx (client:visible)
export default function AppointmentForm() {
  return (
    <form>
      {/* Input se carga con AppointmentForm */}
      <Input name="email" />

      {/* Button se carga con AppointmentForm */}
      <Button type="submit">Enviar</Button>
    </form>
  );
}
```

### 📈 Impacto en Rendimiento

#### Antes (Sin Optimización)
- Todos los componentes cargados inmediatamente
- Bundle inicial: ~150KB
- FCP: ~2.5s
- TTI: ~4s

#### Después (Con Matriz de Decisión)
- Componentes críticos: `client:load` (Login, CRM Dashboard)
- Componentes below-the-fold: `client:visible` (Booking, Forms)
- Componentes pesados: `client:idle` (Properties Dashboard)
- Bundle inicial: ~15KB (solo críticos)
- Lazy chunks: ~45KB (cargados progresivamente)
- FCP: <1s
- TTI: <2s

### ✅ Checklist de Implementación

- [x] `LoginForm` → `client:load` (página login)
- [x] `BookingPublic` → `client:visible` (página citas)
- [x] `AppointmentForm` → `client:visible` (dentro de BookingPublic)
- [x] `AppointmentFormFields` → `client:visible` (dentro de AppointmentForm)
- [x] `CRMDashboardComponent` → `client:load` (página CRM)
- [x] `PropertiesDashboard` → `client:idle` (página propiedades)
- [x] Componentes UI sin directivas (se cargan con padre)

### 🔍 Verificación de Directivas

Para verificar que las directivas están correctas:

```bash
# Buscar todas las directivas client
grep -r "client:" src/

# Verificar componentes principales
grep -r "client:load\|client:visible\|client:idle" src/pages/
```

### 📝 Notas Importantes

1. **Componentes UI no necesitan directivas**: Se cargan automáticamente con su componente padre.

2. **FormField y ErrorMessage son estáticos**: Aunque son TSX, no tienen estado ni hooks, equivalente a componentes Astro en rendimiento.

3. **Jerarquía de carga**:
   - Nivel 1: Componentes principales (tienen directivas)
   - Nivel 2: Componentes UI (sin directivas, se cargan con padre)

4. **Optimización progresiva**: Los componentes se cargan según su criticidad y posición en la página.

---

**Última actualización:** Enero 2025

