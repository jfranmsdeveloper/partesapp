import {
    PhoneOutgoing, PhoneIncoming, Mail, MailOpen,
    Car, GraduationCap, Search, FileText,
    Edit, RefreshCw, Cpu, AlertTriangle, MoreHorizontal, Truck, FileCog
} from 'lucide-react';
import type { ActuacionType } from '../types';

export const ACTUACION_CONFIG: Record<ActuacionType, { icon: any, color: string, label: string }> = {
    'Llamada Realizada': { icon: PhoneOutgoing, color: 'text-blue-500', label: 'Llamada Realizada' },
    'Llamada Recibida': { icon: PhoneIncoming, color: 'text-green-500', label: 'Llamada Recibida' },
    'Correo Enviado': { icon: Mail, color: 'text-amber-600', label: 'Correo Enviado' },
    'Correo Recibido': { icon: MailOpen, color: 'text-indigo-500', label: 'Correo Recibido' },
    'Desplazamiento': { icon: Car, color: 'text-amber-500', label: 'Desplazamiento' },
    'Formación': { icon: GraduationCap, color: 'text-pink-500', label: 'Formación' },
    'Investigación': { icon: Search, color: 'text-cyan-500', label: 'Investigación' },
    'Informe Corporativo': { icon: FileText, color: 'text-gray-500', label: 'Informe' },
    'Modificaciones': { icon: Edit, color: 'text-rose-500', label: 'Modificaciones' },
    'Actualización': { icon: RefreshCw, color: 'text-sky-600', label: 'Actualización' },
    'Cargas/Proceso': { icon: Cpu, color: 'text-slate-600', label: 'Procesos' },
    'Incidencias': { icon: AlertTriangle, color: 'text-red-600', label: 'Incidencias' },
    'Otros': { icon: MoreHorizontal, color: 'text-slate-500', label: 'Otros' },
    'Traslado': { icon: Truck, color: 'text-orange-600', label: 'Traslado' },
    'Tratamiento de Fichero': { icon: FileCog, color: 'text-teal-600', label: 'Ficheros' },
};
