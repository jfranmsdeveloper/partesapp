import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    isWithinInterval,
    parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { Parte } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import type { ActuacionType } from '../../types';

export function parseParteDate(raw: string): Date | null {
    try {
        if (raw.includes('T')) return parseISO(raw);
        if (raw.includes('-')) return new Date(raw.replace(' ', 'T'));
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

export function isMyParte(
    p: Parte,
    currentUser: { email?: string; name?: string; user_metadata?: { full_name?: string } } | null
): boolean {
    if (!currentUser) return false;
    const userEmail = currentUser.email?.toLowerCase();
    const userName = (currentUser.user_metadata?.full_name || currentUser.name || '').toLowerCase();
    const partUser = String(p.userId || '').toLowerCase();
    const partCreator = (p.createdBy || '').toLowerCase();

    return (
        (userEmail && (partUser === userEmail || partCreator === userEmail)) ||
        (userName && partCreator.includes(userName)) ||
        partCreator === 'usuario actual'
    );
}

export function filterPartesInRange(
    partes: Parte[],
    rangeDays: number,
    currentUser: Parameters<typeof isMyParte>[1],
    offsetDays = 0
): Parte[] {
    const now = new Date();
    const end = endOfDay(subDays(now, offsetDays));
    const start =
        rangeDays > 0
            ? startOfDay(subDays(end, rangeDays))
            : new Date(0);

    return partes.filter(p => {
        if (!p.createdAt || !isMyParte(p, currentUser)) return false;
        const date = parseParteDate(p.createdAt);
        if (!date) return false;
        return isWithinInterval(date, { start, end });
    });
}

export function formatMinutesHuman(totalMinutes: number): string {
    if (totalMinutes <= 0) return '0 min';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
}

export function rangeLabel(rangeDays: number): string {
    if (rangeDays === 0) return 'todo el historial';
    if (rangeDays === 7) return 'los últimos 7 días';
    if (rangeDays === 30) return 'los últimos 30 días';
    if (rangeDays === 90) return 'los últimos 90 días';
    return `los últimos ${rangeDays} días`;
}

export function rangeShortLabel(rangeDays: number): string {
    if (rangeDays === 0) return 'Historial';
    if (rangeDays === 7) return '7 días';
    if (rangeDays === 30) return '30 días';
    if (rangeDays === 90) return '90 días';
    return `${rangeDays}d`;
}

export function actuacionShortLabel(type: string): string {
    const cfg = ACTUACION_CONFIG[type as ActuacionType];
    return cfg?.label || type;
}

export function comparePeriods(current: number, previous: number): { delta: number; label: string } | null {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { delta: 100, label: 'sin datos en el periodo anterior' };
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return { delta: 0, label: 'igual que el periodo anterior' };
    return {
        delta: pct,
        label: pct > 0 ? `${pct}% más que el periodo anterior` : `${Math.abs(pct)}% menos que el periodo anterior`,
    };
}

export function formatTrendPeak(trendData: { date: string; count: number }[]): string | null {
    if (trendData.length === 0) return null;
    const peak = trendData.reduce((best, row) => (row.count > best.count ? row : best), trendData[0]);
    if (peak.count <= 0) return null;
    try {
        const d = format(new Date(peak.date), "EEEE d 'de' MMMM", { locale: es });
        return `Día con más partes: ${d} (${peak.count})`;
    } catch {
        return null;
    }
}
