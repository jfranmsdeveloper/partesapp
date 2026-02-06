import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '../../hooks/useUserStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Card } from '../ui/Card';
// import { Badge } from '../ui/Badge';
import { ActuacionesList } from '../actuaciones/ActuacionesList';
import { AddActuacionForm } from '../actuaciones/AddActuacionForm';
import { ChevronLeft, Save, Plus, Trash2, FileUp, Loader2, FileText, Eye, Printer, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { ActuacionType } from '../../types';
import { parsePartePDF } from '../../utils/pdfParser';

import { toLocalISOString } from '../../utils/dateUtils';

export const ParteEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id;

    const { partes, addParte, addActuacion, updateActuacion, deleteActuacion, deleteParte, updateParteStatus, updateParte, addClient, currentUser, users } = useUserStore();

    const [title, setTitle] = useState('');
    const [customId, setCustomId] = useState('');
    const [customDate, setCustomDate] = useState(toLocalISOString(new Date())); // Default to now (Local)
    const [createdBy, setCreatedBy] = useState('Usuario Actual');
    const [uploadedPdf, setUploadedPdf] = useState<string | undefined>(undefined);
    const [showAddActuacion, setShowAddActuacion] = useState(false);
    const [editingActuacion, setEditingActuacion] = useState<{ id: string, data: any } | null>(null);
    const [showCopied, setShowCopied] = useState(false);

    const currentParte = id ? partes.find(p => p.id === parseInt(id)) : undefined;

    // Initialize form if editing
    useEffect(() => {
        if (currentParte) {
            setTitle(currentParte.title);
            setCreatedBy(currentParte.createdBy);
            setCustomId(currentParte.id.toString());
            setCustomDate(toLocalISOString(new Date(currentParte.createdAt)));
            // Note: We don't load the full PDF into state to save memory unless needed, 
            // but for "viewing" we rely on currentParte.pdfFile
        }
    }, [currentParte]);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(''); // New state for progress text

    const handleCreateParte = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        if (!isNew && currentParte) {
            await updateParte(currentParte.id, {
                title,
                createdAt: new Date(customDate).toISOString()
            });
            alert('✅ Parte actualizado correctamente');
            return;
        }

        // Auto-save client
        await addClient({
            name: title,
        });

        await addParte({
            title,
            status: 'ABIERTO',
            createdBy,
            id: customId ? parseInt(customId) : undefined,
            createdAt: new Date(customDate).toISOString(),
            pdfFile: uploadedPdf
        });

        // Ensure we navigate after async operations complete
        navigate('/management');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('Iniciando...');
        try {
            const data = await parsePartePDF(file, (status) => setUploadStatus(status));

            setUploadedPdf(data.pdfFile); // Save base64

            if (data.title) setTitle(data.title);
            if (data.id) setCustomId(data.id);
            if (data.createdBy) setCreatedBy(data.createdBy);

            // Construct date time if available
            if (data.date) {
                // Heuristic: Convert DD/MM/YYYY to YYYY-MM-DD for input
                const [d, m, y] = data.date.split(/[-/]/);
                let dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

                let timeStr = '09:00'; // default
                if (data.time) {
                    timeStr = data.time;
                }

                setCustomDate(`${dateStr}T${timeStr}`);
            }

            alert('✅ Datos extraídos correctamente.');
        } catch (error) {
            console.error(error);
            alert('❌ Error al procesar el PDF.');
        } finally {
            setIsUploading(false);
            setUploadStatus('');
            // Reset input
            e.target.value = '';
        }
    };

    const handleAddOrUpdateActuacion = (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string }) => {
        if (!currentParte) return;

        if (editingActuacion) {
            updateActuacion(currentParte.id, editingActuacion.id, actuacion);
            setEditingActuacion(null);
        } else {
            addActuacion(currentParte.id, {
                ...actuacion,
                timestamp: actuacion.timestamp || new Date().toISOString()
            });
        }
        setShowAddActuacion(false);
    };

    const handleDeleteParte = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este parte y todas sus actuaciones? Esta acción no se puede deshacer.')) {
            if (currentParte) {
                // Delete logic would need add deleteParte to destructuring above first
                // Assuming deleteParte is available in store and destructured
                // Note: I need to update destructuring in next step if not already done
                deleteParte(currentParte.id);
                navigate('/management');
            }
        }
    };

    const handleEditClick = (actuacion: any) => {
        setEditingActuacion({ id: actuacion.id, data: actuacion });
        setShowAddActuacion(true);
    };

    const handleCancelForm = () => {
        setShowAddActuacion(false);
        setEditingActuacion(null);
    };

    const handleViewPdf = () => {
        const pdfData = currentParte?.pdfFile;
        if (pdfData) {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(
                    `<iframe src="${pdfData}" style="width:100%; height:100%; border:none;"></iframe>`
                );
            }
        }
    };

    const handleExportActuaciones = () => {
        if (!currentParte) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Informe de Actuaciones - Parte #${currentParte.id}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; }
                    h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
                    .header { margin-bottom: 2rem; color: #475569; }
                    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                    th { background: #f8fafc; text-align: left; padding: 0.75rem; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #334155; }
                    td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; color: #1e293b; vertical-align: top; }
                    tr:hover { background: #f1f5f9; }
                    .metadata { margin-bottom: 0.5rem; font-size: 0.9rem; }
                    .total { margin-top: 2rem; font-weight: bold; text-align: right; padding-top: 1rem; border-top: 2px solid #e2e8f0; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Informe de Actuaciones</h1>
                
                <div class="header">
                    <div class="metadata"><strong>Parte Nº:</strong> ${currentParte.id}</div>
                    <div class="metadata"><strong>Descripción:</strong> ${currentParte.title}</div>
                    <div class="metadata"><strong>Creado por:</strong> ${currentParte.createdBy}</div>
                    <div class="metadata"><strong>Estado:</strong> ${currentParte.status}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%">Fecha</th>
                            <th style="width: 15%">Tipo</th>
                            <th style="width: 10%">Duración</th>
                            <th style="width: 15%">Técnico</th>
                            <th style="width: 45%">Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentParte.actuaciones.map(act => `
                            <tr>
                                <td>${new Date(act.timestamp).toLocaleString()}</td>
                                <td>${act.type}</td>
                                <td>${act.duration} min</td>
                                <td>${act.user}</td>
                                <td style="white-space: pre-wrap">${act.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total">
                    Total Tiempo: ${currentParte.totalTime} minutos | Total Actuaciones: ${currentParte.totalActuaciones}
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <button onclick="window.print()" style="padding: 0.5rem 1rem; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 0.25rem;">
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        }
    };

    const handleCopyEmail = async () => {
        if (!currentParte || !currentUser) return;

        const userName = currentUser.name || currentUser.email;

        // 1. Plain Text Version (Fallback)
        const actuacionesText = currentParte.actuaciones.map(act =>
            `- ${new Date(act.timestamp).toLocaleString()}: ${act.type} - ${act.notes || 'Sin notas'} (${act.duration} min)`
        ).join('\n');

        const plainMessage = `Actuaciones de ${userName} para cerrar el parte:\n\n${actuacionesText}\n\nTotal: ${currentParte.totalTime} min\n\nGracias.`;

        // 2. HTML Version (Table)
        const emailHtmlContent = `
            <div style="font-family: sans-serif; color: #333;">
                <p>Hola,</p>
                <p>Adjunto actuaciones de <strong>${userName}</strong> para cerrar el parte <strong>#${currentParte.id}</strong> (${currentParte.title}):</p>
                <table style="border-collapse: collapse; width: 100%; max-width: 800px; margin-top: 10px; margin-bottom: 20px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Fecha</th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tipo</th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Duración</th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentParte.actuaciones.map(act => `
                            <tr>
                                <td style="border: 1px solid #e5e7eb; padding: 8px; white-space: nowrap;">${new Date(act.timestamp).toLocaleString()}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">${act.type}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">${act.duration} min</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">${act.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background-color: #f9fafb;">
                             <td colspan="3" style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">TOTAL:</td>
                             <td style="border: 1px solid #e5e7eb; padding: 8px;">${currentParte.totalTime} min</td>
                        </tr>
                    </tfoot>
                </table>
                <p>Un saludo.</p>
            </div>
        `;

        try {
            if (navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([emailHtmlContent], { type: 'text/html' }),
                        'text/plain': new Blob([plainMessage], { type: 'text/plain' })
                    })
                ]);
            } else {
                throw new Error('Clipboard API not fully supported');
            }

            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard', error);
            // Fallback
            navigator.clipboard.writeText(plainMessage).then(() => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            });
        }
    };

    if (!isNew && !currentParte) {
        return <div>Parte no encontrado</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Volver
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {isNew ? 'Nuevo Parte de Trabajo' : `Parte #${currentParte?.id}`}
                    </h1>
                    {!isNew && currentParte && (
                        <div className="relative">
                            <select
                                value={currentParte.status}
                                onChange={(e) => updateParteStatus(currentParte.id, e.target.value as any)}
                                className={clsx(
                                    "appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border-0 focus:ring-2 focus:ring-offset-1 transition-all",
                                    currentParte.status === 'ABIERTO' ? 'bg-green-100 text-green-700 ring-green-500' :
                                        currentParte.status === 'EN TRÁMITE' ? 'bg-blue-100 text-blue-700 ring-blue-500' :
                                            'bg-red-100 text-red-700 ring-red-500'
                                )}
                            >
                                <option value="ABIERTO">ABIERTO</option>
                                <option value="EN TRÁMITE">EN TRÁMITE</option>
                                <option value="CERRADO">CERRADO</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Form */}
            <div className={clsx("grid gap-6", isNew ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
                {/* Left Column: Details */}
                <div className={isNew ? "w-full" : "space-y-6"}>
                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Datos Generales</h2>

                        {isNew && (
                            <div className={clsx("mb-6 p-4 border-2 border-dashed rounded-xl transition-colors relative group",
                                uploadedPdf ? "border-green-300 bg-green-50" : "border-blue-200 bg-blue-50/50 hover:bg-blue-50")}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={isUploading}
                                />
                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                    <div className={clsx("p-3 rounded-full shadow-sm transition-transform group-hover:scale-110", uploadedPdf ? "bg-green-100 text-green-600" : "bg-white text-blue-500")}>
                                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                            uploadedPdf ? <FileText className="w-6 h-6" /> : <FileUp className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className={clsx("font-medium", uploadedPdf ? "text-green-900" : "text-blue-900")}>
                                            {isUploading ? uploadStatus :
                                                uploadedPdf ? 'PDF Cargado y Procesado' : 'Subir PDF para Autocompletar'}
                                        </p>
                                        {!isUploading && !uploadedPdf && (
                                            <p className="text-xs text-blue-600/70 mt-1">
                                                Lee Nº Parte, Fecha, Descripción (Escaneados con OCR).
                                            </p>
                                        )}
                                        {uploadedPdf && (
                                            <p className="text-xs text-green-700 mt-1">El archivo se guardará con el parte.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isNew && currentParte && (
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PDF Abierto</h3>
                                    {currentParte.pdfFile ? (
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="w-full" onClick={handleViewPdf}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Ver Abierto
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    // Manual upload without OCR
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const base64 = reader.result as string;
                                                        if (currentParte) {
                                                            updateParte(currentParte.id, { pdfFile: base64 });
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                                className="hidden"
                                                id="upload-pdf-manual"
                                            />
                                            <label htmlFor="upload-pdf-manual">
                                                <Button variant="outline" className="w-full cursor-pointer" type="button" onClick={() => document.getElementById('upload-pdf-manual')?.click()}>
                                                    <FileUp className="w-4 h-4 mr-2" />
                                                    Subir PDF Abierto
                                                </Button>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PDF Cerrado</h3>
                                    {currentParte.pdfFileSigned ? (
                                        <Button variant="primary" className="w-full" onClick={() => {
                                            const w = window.open();
                                            w?.document.write(`<iframe src="${currentParte.pdfFileSigned}" style="width:100%;height:100%;border:none;"></iframe>`);
                                        }}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver Cerrado
                                        </Button>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const base64 = reader.result as string;
                                                        if (currentParte) {
                                                            updateParte(currentParte.id, { pdfFileSigned: base64 });
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                                className="hidden"
                                                id="upload-pdf-signed"
                                            />
                                            <label htmlFor="upload-pdf-signed">
                                                <Button variant="outline" className="w-full dashed border-slate-300 text-slate-500 hover:text-blue-500 cursor-pointer" type="button" onClick={() => document.getElementById('upload-pdf-signed')?.click()}>
                                                    <FileUp className="w-4 h-4 mr-2" />
                                                    Subir Firmado
                                                </Button>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <form id="parte-form" onSubmit={handleCreateParte} className="space-y-6">
                            <div className={clsx("grid gap-6", isNew ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1")}>
                                <div className={clsx("grid gap-4", isNew ? "grid-cols-2 col-span-2" : "grid-cols-2")}>
                                    <Input
                                        label="Nº Parte"
                                        type="number"
                                        value={customId}
                                        onChange={(e) => setCustomId(e.target.value)}
                                        placeholder="Auto"
                                        disabled={!isNew}
                                        title={customId || "Auto"}
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <DatePicker
                                                label="Fecha Creación"
                                                value={customDate.split('T')[0]}
                                                onChange={(date) => {
                                                    const time = customDate.split('T')[1] || '09:00';
                                                    setCustomDate(`${date}T${time}`);
                                                }}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                label="Hora"
                                                type="time"
                                                value={customDate.split('T')[1] || '09:00'}
                                                onChange={(e) => {
                                                    const date = customDate.split('T')[0];
                                                    setCustomDate(`${date}T${e.target.value}`);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Emitido por</label>
                                    {!isNew ? (
                                        <Input
                                            value={createdBy}
                                            onChange={(e) => setCreatedBy(e.target.value)}
                                            readOnly
                                            disabled
                                        />
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={createdBy}
                                                onChange={(e) => setCreatedBy(e.target.value)}
                                                required
                                                disabled={!isNew}
                                                className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                                            >
                                                <option value="" disabled>Selecciona un usuario</option>
                                                {users.map((u) => {
                                                    const name = u.user_metadata?.full_name || u.name || u.email;
                                                    return <option key={u.id} value={name}>{name}</option>
                                                })}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Input
                                label="Título / Descripción"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej. Incidencia WiFi cliente X"
                                required
                                className="w-full text-lg"
                                title={title}
                            />

                            <div className="pt-2 flex flex-col items-center">
                                <Button type="submit" className="w-full md:w-auto md:px-12 md:py-3 text-lg">
                                    <Save className="w-5 h-5 mr-2" />
                                    {isNew ? 'Crear Parte' : 'Guardar Cambios'}
                                </Button>
                                {isNew && (
                                    <p className="text-sm text-slate-500 mt-3 text-center">
                                        Podrás añadir actuaciones una vez creado el parte.
                                    </p>
                                )}
                            </div>
                        </form>
                    </Card>

                    {!isNew && currentParte && (
                        <Card>
                            <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Total Tiempo</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{currentParte.totalTime} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Actuaciones</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{currentParte.totalActuaciones}</span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Actuaciones (Only visible if not new) */}
                {!isNew && currentParte && (
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold">Actuaciones</h2>
                                {!showAddActuacion && (
                                    <div className="flex gap-2">
                                        <Button onClick={handleExportActuaciones} variant="outline" size="sm">
                                            <Printer className="w-4 h-4 mr-2" />
                                            Informe
                                        </Button>
                                        <Button
                                            onClick={handleCopyEmail}
                                            variant="outline"
                                            size="sm"
                                            className={clsx("transition-all duration-300", showCopied ? "border-green-500 text-green-600 bg-green-50" : "")}
                                        >
                                            {showCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                            {showCopied ? '¡Copiado!' : 'Copiar Email'}
                                        </Button>
                                        <Button onClick={() => { setEditingActuacion(null); setShowAddActuacion(true); }} size="sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nueva Actuación
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {showAddActuacion && (
                                <div className="mb-8">
                                    <AddActuacionForm
                                        onAdd={handleAddOrUpdateActuacion}
                                        onCancel={handleCancelForm}
                                        initialData={editingActuacion?.data}
                                        defaultTimestamp={(() => {
                                            if (currentParte.actuaciones.length === 0) return currentParte.createdAt;
                                            const lastAct = currentParte.actuaciones[currentParte.actuaciones.length - 1];
                                            const endDate = new Date(new Date(lastAct.timestamp).getTime() + lastAct.duration * 60000);
                                            return endDate.toISOString();
                                        })()}
                                        key={editingActuacion?.id || 'new'} // Force re-render on switch
                                    />
                                </div>
                            )}

                            <ActuacionesList
                                actuaciones={currentParte.actuaciones}
                                onDelete={(actuacionId) => deleteActuacion(currentParte.id, actuacionId)}
                                onEdit={handleEditClick}
                            />
                        </Card>

                        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 pb-20 border-t border-slate-100 gap-4">
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={handleDeleteParte}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar Parte
                            </Button>

                            <div className="flex items-center gap-6">
                                {/* Avatares de participantes */}
                                <div className="flex -space-x-3">
                                    {Array.from(new Set(currentParte.actuaciones.map(a => a.user))).map((userName) => {
                                        const userObj = users.find(u => (u.user_metadata?.full_name || u.name) === userName || u.email === userName);
                                        const hasAvatar = userObj?.avatar_url;

                                        return (
                                            <div key={userName} className="relative z-10 transition-transform hover:scale-110 hover:z-20 group" title={userName}>
                                                {hasAvatar ? (
                                                    <img
                                                        src={userObj.avatar_url}
                                                        alt={userName}
                                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs text-orange-700 dark:text-orange-200 font-bold uppercase ring-2 ring-white dark:ring-slate-900 shadow-md">
                                                        {userName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3">
                                    {currentParte.status !== 'CERRADO' && (
                                        <Button
                                            variant="danger"
                                            onClick={() => updateParteStatus(currentParte.id, 'CERRADO')}
                                            disabled={currentParte.actuaciones.length === 0}
                                        >
                                            Cerrar Parte
                                        </Button>
                                    )}
                                    {currentParte.status === 'CERRADO' && (
                                        <Button variant="outline" onClick={() => updateParteStatus(currentParte.id, 'EN TRÁMITE')}>
                                            Reabrir Parte
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
