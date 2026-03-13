import {
    PhoneOutgoing, PhoneIncoming, Mail, MailOpen,
    Car, GraduationCap, Search, FileText,
    Edit, RefreshCw, Cpu, AlertTriangle, MoreHorizontal, Truck, FileCog
} from 'lucide-react';
import type { ActuacionType } from '../types';

export const ACTUACION_CONFIG: Record<ActuacionType, { icon: any, themeColor: string, label: string }> = {
    'Llamada Realizada': { icon: PhoneOutgoing, themeColor: 'blue', label: 'Llamada Realizada' },
    'Llamada Recibida': { icon: PhoneIncoming, themeColor: 'green', label: 'Llamada Recibida' },
    'Correo Enviado': { icon: Mail, themeColor: 'amber', label: 'Correo Enviado' },
    'Correo Recibido': { icon: MailOpen, themeColor: 'indigo', label: 'Correo Recibido' },
    'Desplazamiento': { icon: Car, themeColor: 'amber', label: 'Desplazamiento' },
    'Formación': { icon: GraduationCap, themeColor: 'pink', label: 'Formación' },
    'Investigación': { icon: Search, themeColor: 'cyan', label: 'Investigación' },
    'Informe Corporativo': { icon: FileText, themeColor: 'gray', label: 'Informe' },
    'Modificaciones': { icon: Edit, themeColor: 'rose', label: 'Modificaciones' },
    'Actualización': { icon: RefreshCw, themeColor: 'sky', label: 'Actualización' },
    'Cargas/Proceso': { icon: Cpu, themeColor: 'slate', label: 'Procesos' },
    'Incidencias': { icon: AlertTriangle, themeColor: 'red', label: 'Incidencias' },
    'Otros': { icon: MoreHorizontal, themeColor: 'slate', label: 'Otros' },
    'Traslado': { icon: Truck, themeColor: 'orange', label: 'Traslado' },
    'Tratamiento de Fichero': { icon: FileCog, themeColor: 'teal', label: 'Ficheros' },
};
