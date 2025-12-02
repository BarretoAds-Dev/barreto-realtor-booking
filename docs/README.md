# 📚 Documentación del Proyecto

Esta carpeta contiene toda la documentación técnica del proyecto.

## 📋 Índice de Documentos

### 🚀 Arquitectura y Optimización

- **[ARCHITECTURE_OPTIMIZATION.md](./ARCHITECTURE_OPTIMIZATION.md)** - Guía completa de la arquitectura optimizada v2: Velocidad Luz + Backend Unificado
  - Backend unificado con servicios compartidos
  - Frontend optimizado con Islands Architecture
  - Reglas de oro y mejores prácticas
  - Métricas esperadas

- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)** - Resumen ejecutivo de todas las optimizaciones aplicadas
  - Estado final de la arquitectura
  - Checklist de optimizaciones
  - Estructura de archivos
  - Próximos pasos recomendados

### 🐛 Debug y Troubleshooting

- **[DEBUG_CITAS.md](./DEBUG_CITAS.md)** - Documentación de debugging del sistema de citas
  - Problemas conocidos y soluciones
  - Logs y debugging
  - Troubleshooting común

## 🎯 Estructura del Proyecto

```
src/
├── 1-app-global-core/    # Core global compartido
├── 2-app-crm/            # Sistema CRM y reservas
└── 3-app-site/           # Website público (futuro)
```

## 📖 Guías Rápidas

### Para Desarrolladores

1. **Arquitectura**: Lee `ARCHITECTURE_OPTIMIZATION.md` para entender la estructura
2. **Optimizaciones**: Revisa `OPTIMIZATION_SUMMARY.md` para ver qué se ha optimizado
3. **Debugging**: Consulta `DEBUG_CITAS.md` si encuentras problemas con citas

### Para Nuevos Miembros del Equipo

1. Empieza con `ARCHITECTURE_OPTIMIZATION.md` para entender la arquitectura
2. Revisa `OPTIMIZATION_SUMMARY.md` para ver el estado actual
3. Consulta `DEBUG_CITAS.md` solo si necesitas hacer debugging

## 🔄 Actualización de Documentación

Esta documentación se actualiza cuando:
- Se realizan cambios arquitectónicos importantes
- Se aplican nuevas optimizaciones
- Se identifican nuevos problemas o soluciones

---

**Última actualización**: Diciembre 2024

