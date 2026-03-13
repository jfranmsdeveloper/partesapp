export type ParteStatus = 'ABIERTO' | 'EN TRÁMITE' | 'CERRADO';

export type ActuacionType =
    | 'Llamada Realizada'
    | 'Llamada Recibida'
    | 'Correo Enviado'
    | 'Correo Recibido'
    | 'Desplazamiento'
    | 'Formación'
    | 'Investigación'
    | 'Informe Corporativo'
    | 'Modificaciones'
    | 'Actualización'
    | 'Cargas/Proceso'
    | 'Incidencias'
    | 'Otros'
    | 'Traslado'
    | 'Tratamiento de Fichero';

export interface Actuacion {
    id: string;
    parteId: number;
    type: ActuacionType;
    timestamp: string; // ISO date string
    duration: number; // minutes
    notes?: string;
    user: string;
    tags?: string[];
    priority?: 'BAJA' | 'MEDIA' | 'ALTA';
}

export interface Parte {
    id: number;
    title: string;
    status: ParteStatus;
    createdAt: string; // ISO date string
    closedAt?: string; // ISO date string
    createdBy: string;
    userId: string; // Owner email

    // PDF Storage (Base64)
    pdfFile?: string; // Base64 encoded original PDF
    pdfFileSigned?: string; // Base64 encoded signed/closed PDF

    actuaciones: Actuacion[];
    // Computed fields (for display optimization, though can be derived)
    totalTime: number;
    totalActuaciones: number;
    clientId?: string;
    clientName?: string;
}

export interface Client {
    id: string;
    name: string;
    dni?: string;
    email?: string;
    phone?: string;
    userId: string; // Owner email
}

export interface User {
    id?: string;
    email: string;
    password: string;
    name?: string;
    role?: string;
    avatar_url?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        [key: string]: any;
    };
    created_at?: string;
}

export interface Snippet {
    id: string;
    title: string;
    content: string;
    userId: string;
}
