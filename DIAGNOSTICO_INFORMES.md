# Diagnóstico de Problemas en Informes

## Problemas Identificados y Corregidos

### 1. ✅ Cálculo de Usuarios Atendidos (Permitiendo Repeticiones)

**Comportamiento Actual:**
- El campo "Número total de elementos identificados para asistencia (USUARIOS)" cuenta **todos los partes que tienen un cliente asignado**
- **Permite repeticiones**: Si un mismo cliente tiene 5 partes, cuenta como 5 usuarios atendidos
- Los partes sin `clientId` asignado NO se cuentan

**Solución Aplicada:**
- Modificado en los 3 generadores:
  - `wordGenerator.ts` (línea 66-68)
  - `excelGenerator.ts` (línea 64-66)
  - `pdfGenerator.ts` (línea 93-95)
- Ahora cuenta: `partes.filter(p => p.clientId).length`

**Código Actual:**
```typescript
// Count all partes with clientId (allowing duplicates)
// Si un cliente tiene 5 partes, cuenta como 5 usuarios atendidos
const totalUsersAttended = partes.filter(p => p.clientId).length;
return { users: totalUsersAttended, ... } // ✅ CORRECTO
```

**Ejemplo:**
- Cliente A tiene 3 partes → Cuenta como 3
- Cliente B tiene 2 partes → Cuenta como 2
- 1 parte sin cliente → No cuenta
- **Total usuarios atendidos: 5**

---

## Posibles Causas de Partes ABIERTOS/CERRADOS en 0

Si en tu informe aparecen **0 partes abiertos** y **0 cerrados**, puede deberse a:

### 1. Filtrado de Fechas
El filtro de fechas usa `isWithinInterval` con el campo `createdAt` del parte.

**Verifica:**
- ¿El rango de fechas seleccionado incluye tus partes?
- ¿Los partes tienen `createdAt` válido?

**Código de filtrado (ReportModal.tsx líneas 49-58):**
```typescript
const filteredPartes = scopePartes.filter(p => {
    const pDate = new Date(p.createdAt);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return isWithinInterval(pDate, { start, end });
});
```

### 2. Filtrado por Alcance (Scope)
Si estás en modo "Solo Mis Partes", solo se incluyen partes donde:
- `parte.userId === currentUser.id` O
- `parte.userId === currentUser.email`

**Verifica:**
- ¿Estás usando "Solo Mis Partes" o "Global (Todos)"?
- ¿Los partes tienen el `userId` correcto asignado?

**Código de filtrado (ReportModal.tsx líneas 44-46):**
```typescript
const scopePartes = reportScope === 'all'
    ? partes
    : partes.filter(p => p.userId === currentUser?.id || p.userId === currentUser?.email);
```

### 3. Estados de Partes en Base de Datos
Los estados válidos son: `'ABIERTO'`, `'EN TRÁMITE'`, `'CERRADO'`

**Verifica en la base de datos:**
```sql
-- Ver distribución de estados
SELECT status, COUNT(*) as total 
FROM partes 
GROUP BY status;

-- Ver partes sin clientId
SELECT COUNT(*) as sin_cliente 
FROM partes 
WHERE client_id IS NULL;

-- Ver partes por usuario
SELECT user_id, COUNT(*) as total 
FROM partes 
GROUP BY user_id;
```

---

## Cómo Verificar los Datos

### Opción 1: Consola del Navegador
1. Abre la aplicación
2. Abre DevTools (F12)
3. En la consola, ejecuta:
```javascript
// Ver todos los partes
console.table($store.partes.map(p => ({
    id: p.id,
    status: p.status,
    clientId: p.clientId,
    userId: p.userId,
    createdAt: p.createdAt
})));

// Ver estadísticas
const stats = {
    total: $store.partes.length,
    abiertos: $store.partes.filter(p => p.status === 'ABIERTO').length,
    cerrados: $store.partes.filter(p => p.status === 'CERRADO').length,
    enTramite: $store.partes.filter(p => p.status === 'EN TRÁMITE').length,
    conCliente: $store.partes.filter(p => p.clientId).length,
    sinCliente: $store.partes.filter(p => !p.clientId).length
};
console.table(stats);
```

### Opción 2: Añadir Logs Temporales
En `ReportModal.tsx`, después de la línea 58, añade:
```typescript
console.log('=== DEBUG INFORME ===');
console.log('Rango de fechas:', { startDate, endDate });
console.log('Alcance:', reportScope);
console.log('Total partes en store:', partes.length);
console.log('Partes después de filtro scope:', scopePartes.length);
console.log('Partes después de filtro fecha:', filteredPartes.length);
console.log('Métricas calculadas:', metrics);
console.log('Distribución de estados:', {
    abiertos: filteredPartes.filter(p => p.status === 'ABIERTO').length,
    enTramite: filteredPartes.filter(p => p.status === 'EN TRÁMITE').length,
    cerrados: filteredPartes.filter(p => p.status === 'CERRADO').length
});
```

---

## Resumen de Cambios Realizados

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `wordGenerator.ts` | 66-67 | Eliminado fallback `partes.length` para usuarios |
| `excelGenerator.ts` | 64-65 | Eliminado fallback `partes.length` para usuarios |
| `pdfGenerator.ts` | 93-94 | Eliminado fallback `partes.length` para usuarios |

---

## Próximos Pasos

1. **Verificar datos en la aplicación** usando las opciones anteriores
2. **Revisar la base de datos** con las queries SQL sugeridas
3. **Comprobar el rango de fechas** en el modal de informes
4. **Verificar el alcance** (Me vs Global)
5. **Reportar hallazgos** para continuar con el diagnóstico si es necesario
