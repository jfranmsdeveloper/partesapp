// Test script para verificar la lógica de cálculo de métricas
// Este script simula el cálculo que se hace en los generadores de informes

import { type Parte, type ActuacionType } from '../types';

// Simular datos de prueba
const testPartes: Partial<Parte>[] = [
    {
        id: 1,
        status: 'ABIERTO',
        clientId: 'client-1',
        createdAt: '2026-02-01T10:00:00',
        actuaciones: [
            { type: 'Llamada Recibida', duration: 10 } as any,
            { type: 'Incidencias', duration: 20 } as any
        ]
    },
    {
        id: 2,
        status: 'CERRADO',
        clientId: 'client-1', // Mismo cliente
        createdAt: '2026-02-05T10:00:00',
        actuaciones: [
            { type: 'Traslado', duration: 5 } as any,
            { type: 'Incidencias', duration: 15 } as any
        ]
    },
    {
        id: 3,
        status: 'CERRADO',
        clientId: 'client-2', // Diferente cliente
        createdAt: '2026-02-10T10:00:00',
        actuaciones: [
            { type: 'Incidencias', duration: 30 } as any
        ]
    },
    {
        id: 4,
        status: 'ABIERTO',
        clientId: undefined, // Sin cliente asignado
        createdAt: '2026-02-12T10:00:00',
        actuaciones: [
            { type: 'Llamada Realizada', duration: 5 } as any
        ]
    }
];

// Función de cálculo (copiada de los generadores)
const calculateMetrics = (partes: Partial<Parte>[]) => {
    const acts = partes.flatMap(p => p.actuaciones || []);
    const countType = (t: ActuacionType) => acts.filter(a => a.type === t).length;

    const trasladosCount = countType('Traslado');
    const cerrados = partes.filter(p => p.status === 'CERRADO').length;
    const resueltasDirectas = Math.max(0, cerrados - trasladosCount);
    // Count unique clients (usuarios distintos atendidos)
    const uniqueClients = new Set(partes.map(p => p.clientId).filter(Boolean)).size;

    return {
        users: uniqueClients,
        abiertos: partes.filter(p => p.status === 'ABIERTO').length,
        cerrados: cerrados,
        resueltas_directas: resueltasDirectas,
        act_traslados: trasladosCount,
        act_llamada_recibida: countType('Llamada Recibida'),
        act_llamada_realizada: countType('Llamada Realizada'),
    };
};

console.log('=== TEST DE CÁLCULO DE MÉTRICAS ===\n');
console.log('Datos de prueba:');
console.log(`- Total partes: ${testPartes.length}`);
console.log(`- Partes con clientId: ${testPartes.filter(p => p.clientId).length}`);
console.log(`- Partes ABIERTOS: ${testPartes.filter(p => p.status === 'ABIERTO').length}`);
console.log(`- Partes CERRADOS: ${testPartes.filter(p => p.status === 'CERRADO').length}`);
console.log(`- Clientes únicos: client-1, client-2 (2 únicos)\n`);

const metrics = calculateMetrics(testPartes);

console.log('Resultados del cálculo:');
console.log(`- Usuarios distintos atendidos: ${metrics.users} (esperado: 2)`);
console.log(`- Avisos recibidos (ABIERTOS): ${metrics.abiertos} (esperado: 2)`);
console.log(`- Incidencias atendidas (CERRADOS): ${metrics.cerrados} (esperado: 2)`);
console.log(`- Resueltas directas: ${metrics.resueltas_directas} (esperado: 1, porque hay 1 traslado)`);
console.log(`- Traslados: ${metrics.act_traslados} (esperado: 1)`);
console.log(`- Llamadas recibidas: ${metrics.act_llamada_recibida} (esperado: 1)`);
console.log(`- Llamadas realizadas: ${metrics.act_llamada_realizada} (esperado: 1)`);

console.log('\n=== VERIFICACIÓN ===');
const allCorrect =
    metrics.users === 2 &&
    metrics.abiertos === 2 &&
    metrics.cerrados === 2 &&
    metrics.resueltas_directas === 1 &&
    metrics.act_traslados === 1;

if (allCorrect) {
    console.log('✅ Todos los cálculos son correctos');
} else {
    console.log('❌ Hay errores en los cálculos');
}
