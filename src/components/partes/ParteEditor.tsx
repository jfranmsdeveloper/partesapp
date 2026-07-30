/* UI Version: 12:30 Baseline */
/* UI Version: 12:30 Baseline */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../../hooks/useUserStore';
import { supabase } from '../../utils/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { ClientSelect } from '../ui/ClientSelect';
import { Card } from '../ui/Card';
// import { Badge } from '../ui/Badge';
import { ActuacionesList } from '../actuaciones/ActuacionesList';
import { AddActuacionForm } from '../actuaciones/AddActuacionForm';
import { ChevronLeft, ChevronRight, Search, Save, Plus, Trash2, FileUp, Loader2, Eye, Printer, Copy, Check, FileWarning, Files, Clock, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { ActuacionType } from '../../types';
import { parsePartePDF } from '../../utils/pdfParser';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { toLocalISOString } from '../../utils/dateUtils';

export const ParteEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id;

    const { partes, clients, addParte, addActuacion, updateActuacion, deleteActuacion, deleteParte, updateParteStatus, updateParte, currentUser, users, upsertClientFromPDF, linkPdfToParte, isLoading, setCommandPaletteOpen } = useUserStore();

    const [title, setTitle] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [customId, setCustomId] = useState('');
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');

    const [customDate, setCustomDate] = useState(() => {
        if (dateParam) {
            // Ensure format is YYYY-MM-DDTHH:mm
            const date = new Date(dateParam);
            if (!isNaN(date.getTime())) {
                const now = new Date();
                date.setHours(now.getHours(), now.getMinutes());
                return toLocalISOString(date);
            }
        }
        return toLocalISOString(new Date());
    }); // Default to now (Local)


    // Initialize with current user name if available
    const [createdBy, setCreatedBy] = useState(() => {
        if (currentUser) {
            return currentUser.user_metadata?.full_name || currentUser.name || currentUser.email || 'Usuario Actual';
        }
        return 'Usuario Actual';
    });

    // Update createdBy when currentUser loads (if it was default)
    useEffect(() => {
        if (isNew && currentUser && createdBy === 'Usuario Actual') {
            setCreatedBy(currentUser.user_metadata?.full_name || currentUser.name || currentUser.email || 'Usuario Actual');
        }
    }, [currentUser, isNew]);
    const [uploadedPdf, setUploadedPdf] = useState<string | undefined>(undefined);
    const [showAddActuacion, setShowAddActuacion] = useState(false);
    const [editingActuacion, setEditingActuacion] = useState<{ id: string, data: any } | null>(null);
    const [showCopied, setShowCopied] = useState(false);
    const [isDatosOpen, setIsDatosOpen] = useState(isNew);
    const formAnchorRef = useRef<HTMLDivElement>(null);


    const currentParte = id ? partes.find(p => String(p.id) === String(id)) : undefined;

    const [currentIndex, setCurrentIndex] = useState(-1);

    useEffect(() => {
        if (!isNew && currentParte) {
            const index = partes.findIndex(p => String(p.id) === String(currentParte.id));
            setCurrentIndex(index);
        }
    }, [currentParte, partes, isNew]);

    const handlePrevParte = () => {
        if (currentIndex < partes.length - 1) {
            navigate(`/parte/${partes[currentIndex + 1].id}`);
        }
    };

    const handleNextParte = () => {
        if (currentIndex > 0) {
            navigate(`/parte/${partes[currentIndex - 1].id}`);
        }
    };

    // Initialize form if editing
    useEffect(() => {
        if (currentParte) {
            setTitle(currentParte.title);
            setCreatedBy(currentParte.createdBy);
            setCustomId(currentParte.id.toString());
            setCustomDate(toLocalISOString(new Date(currentParte.createdAt)));
            setSelectedClientId(currentParte.clientId || '');
            // Open metadata panel when PDF is missing so the warning is visible
            if (!currentParte.pdfFile) setIsDatosOpen(true);
        }
    }, [currentParte]);

    // Global shortcut for new actuacion
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                if (!isNew && currentParte && !showAddActuacion) {
                    openActuacionForm(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isNew, currentParte, showAddActuacion]);

    const [isUploading, setIsUploading] = useState(false);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const singleInputRef = useRef<HTMLInputElement>(null);
    const bulkInputRef = useRef<HTMLInputElement>(null);

    const handleCreateParte = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        if (!isNew && currentParte) {
            // Fix: Send local time string formatted for MySQL (YYYY-MM-DD HH:MM:SS)
            // avoiding UTC conversion which shifts time by -1/-2 hours.
            const formattedDate = customDate.replace('T', ' ') + (customDate.includes(':') && customDate.split(':').length === 2 ? ':00' : '');

            await updateParte(currentParte.id, {
                title,
                createdAt: formattedDate,
                createdBy, // Include createdBy to save authorship changes
                clientId: selectedClientId
            });
            alert('✅ Parte actualizado correctamente');
            return;
        }



        await addParte({
            title,
            status: 'ABIERTO',
            createdBy,
            id: customId || undefined,
            createdAt: customDate.replace('T', ' ') + (customDate.includes(':') && customDate.split(':').length === 2 ? ':00' : ''),
            pdfFile: uploadedPdf,
            clientId: selectedClientId
        });

        // Ensure we navigate after async operations complete
        navigate('/management');
    };

    const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const data = await parsePartePDF(file);

            if (!isNew && currentParte) {
                // If we are editing an existing parte, LINK the PDF to it
                if (data.id) {
                    await linkPdfToParte(currentParte.id, data.id, data.pdfFile!);
                    setCustomId(data.id);
                    setUploadedPdf(data.pdfFile);
                    alert(`✅ PDF vinculado correctamente. El ID del parte ha cambiado de ${currentParte.id} a ${data.id}.`);
                } else {
                    setUploadedPdf(data.pdfFile);
                    alert('✅ PDF cargado correctamente.');
                }
                return;
            }

            setUploadedPdf(data.pdfFile); // Save base64

            if (data.title) setTitle(data.title);
            if (data.id) setCustomId(data.id);

            // Construct date time if available
            if (data.date) {
                const [d, m, y] = data.date.split(/[-/]/);
                const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                let timeStr = data.time || '09:00';
                setCustomDate(`${dateStr}T${timeStr}`);
            }

            if (data.createdBy) {
                const clientId = await upsertClientFromPDF(data.createdBy, data.createdByCode);
                if (clientId) {
                    setSelectedClientId(clientId);
                }
            }

            alert('✅ Datos extraídos correctamente.');
        } catch (error) {
            console.error(error);
            alert('❌ Error al procesar el PDF.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsBulkUploading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const data = await parsePartePDF(file);
                
                // 1. Upsert Client (if present in PDF)
                let clientId = undefined;
                if (data.createdBy) {
                    clientId = await upsertClientFromPDF(data.createdBy, data.createdByCode) || undefined;
                }

                // 2. Parse Date
                let createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
                if (data.date) {
                    const [d, m, y] = data.date.split(/[-/]/);
                    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    let timeStr = data.time || '09:00';
                    createdAt = `${dateStr} ${timeStr}:00`;
                }

                // 3. Add Parte
                const sessionUserName = currentUser?.user_metadata?.full_name || currentUser?.name || currentUser?.email || 'Sistema';

                await addParte({
                    title: data.title || `Parte importado - ${file.name}`,
                    status: 'ABIERTO',
                    createdBy: sessionUserName,
                    id: data.id || undefined,
                    createdAt: createdAt,
                    pdfFile: data.pdfFile,
                    clientId: clientId
                });

                successCount++;
            } catch (err) {
                console.error(`Error importing ${file.name}:`, err);
                errorCount++;
            }
        }

        setIsBulkUploading(false);
        if (e.target) e.target.value = '';

        if (errorCount === 0) {
            alert(`✅ ¡Éxito! Se han importado ${successCount} partes correctamente.`);
            navigate('/management');
        } else {
            alert(`⚠️ Importación completada con avisos:\n- ${successCount} exitosos\n- ${errorCount} errores`);
            navigate('/management');
        }
    };


    const handleAddOrUpdateActuacion = async (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string }, keepOpen?: boolean) => {
        if (!currentParte) return;

        if (editingActuacion) {
            await updateActuacion(currentParte.id, editingActuacion.id, actuacion);
            setEditingActuacion(null);
        } else {
            // Default timestamp if missing: Local time
            const now = new Date();
            const localIso = toLocalISOString(now);
            const formattedNow = localIso.replace('T', ' ') + (localIso.includes(':') && localIso.split(':').length === 2 ? ':00' : '');

            await addActuacion(currentParte.id, {
                ...actuacion,
                timestamp: actuacion.timestamp || formattedNow
            });
        }
        
        if (!keepOpen) {
            setShowAddActuacion(false);
        }
    };

    const handleDeleteParte = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este parte y todas sus actuaciones? Esta acción no se puede deshacer.')) {
            if (currentParte) {
                // Delete logic would need add deleteParte to destructuring above first
                // Assuming deleteParte is available in store and destructured
                // Note: I need to update destructuring in next step if not already done
                await deleteParte(currentParte.id);
                navigate('/management');
            }
        }
    };

    const openActuacionForm = (editing?: { id: string, data: any } | null) => {
        setEditingActuacion(editing || null);
        setShowAddActuacion(true);
        setTimeout(() => {
            formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    };

    const handleEditClick = (actuacion: any) => {
        openActuacionForm({ id: actuacion.id, data: actuacion });
    };

    const handleCancelForm = () => {
        setShowAddActuacion(false);
        setEditingActuacion(null);
    };

    const handleViewPdf = async () => {
        const pdfData = currentParte?.pdfFile;
        if (pdfData) {
            let src = pdfData;
            if (pdfData.startsWith('local://')) {
                const url = await (supabase as any).getFileUrl(pdfData);
                if (url) src = url;
            }
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(
                    `<iframe src="${src}" style="width:100%; height:100%; border:none;"></iframe>`
                );
            }
        }
    };

    const handleViewSignedPdf = async () => {
        const pdfData = currentParte?.pdfFileSigned;
        if (pdfData) {
            let src = pdfData;
            if (pdfData.startsWith('local://')) {
                const url = await (supabase as any).getFileUrl(pdfData);
                if (url) src = url;
            }
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(
                    `<iframe src="${src}" style="width:100%; height:100%; border:none;"></iframe>`
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


    if (!isNew && isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-vh-50 py-20 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-500 animate-pulse font-medium">Cargando información del parte...</p>
            </div>
        );
    }

    if (!isNew && !currentParte) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="p-4 bg-red-50 rounded-full">
                    <Trash2 className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Parte no encontrado</h2>
                <p className="text-slate-500 text-center max-w-xs">El parte que buscas no existe o ha sido eliminado.</p>
                <Button onClick={() => navigate('/management')} variant="outline">
                    Volver a Gestión
                </Button>
            </div>
        );
    }

    const selectedClientName = clients.find(c => String(c.id) === String(selectedClientId))?.name
        || currentParte?.clientName
        || '';

    const formattedParteDate = (() => {
        try {
            return format(new Date(customDate), "d MMM yyyy · HH:mm", { locale: es });
        } catch {
            return customDate;
        }
    })();

    const datosGeneralesForm = (
        <form id="parte-form" onSubmit={handleCreateParte} className="space-y-5">
            <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                    <Input
                        label="Nº Parte"
                        type="text"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value)}
                        placeholder="Auto"
                        disabled={!isNew}
                        title={customId || "Auto"}
                    />
                </div>
                <div>
                    <DatePicker
                        label="Fecha"
                        value={customDate.split('T')[0]}
                        onChange={(date) => {
                            const time = customDate.split('T')[1] || '09:00';
                            setCustomDate(`${date}T${time}`);
                        }}
                    />
                </div>
                <div>
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
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Emitido por</label>
                    {!isNew && createdBy !== 'Usuario Actual' ? (
                        <Input
                            value={createdBy}
                            onChange={(e) => setCreatedBy(e.target.value)}
                            readOnly
                            disabled
                        />
                    ) : (
                        <div className="relative">
                            <select
                                value={createdBy === 'Usuario Actual' ? '' : createdBy}
                                onChange={(e) => setCreatedBy(e.target.value)}
                                required
                                className="block w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                            >
                                <option value="" disabled>
                                    {createdBy === 'Usuario Actual' ? 'Selecciona el usuario' : 'Selecciona un usuario'}
                                </option>
                                {users.map((u) => {
                                    const name = u.user_metadata?.full_name || u.name || u.email;
                                    return <option key={u.id} value={name}>{name}</option>;
                                })}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ClientSelect
                label="Solicitado por"
                value={selectedClientId}
                onChange={setSelectedClientId}
                disabled={false}
            />

            <Input
                label="Título / Descripción"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Incidencia WiFi cliente X"
                required
                className="w-full"
                title={title}
            />

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
                <Save className="w-4 h-4 mr-2" />
                {isNew ? 'Crear Parte' : 'Guardar Cambios'}
            </Button>
            {isNew && (
                <p className="text-xs text-slate-500 text-center -mt-2">
                    Podrás añadir actuaciones una vez creado el parte.
                </p>
            )}
        </form>
    );

    return (
        <div className="space-y-5">
            {/* Sticky workspace header */}
            <div className="sticky top-4 z-20 rounded-[1.75rem] bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] px-4 py-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2 shrink-0">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                            {isNew ? 'Nuevo Parte' : `Parte #${currentParte?.id}`}
                        </h1>
                        {!isNew && currentParte && (
                            <div className="relative">
                                <select
                                    value={currentParte.status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value as any;
                                        if (newStatus === 'CERRADO' && currentParte.actuaciones.length === 0) {
                                            alert('⚠️ No se puede cerrar un parte sin actuaciones. Añade al menos una actuación.');
                                            return;
                                        }
                                        updateParteStatus(currentParte.id, newStatus);
                                    }}
                                    className={clsx(
                                        "appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border-0 focus:ring-2 focus:ring-offset-1 transition-all",
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
                        {!isNew && currentParte && (
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                                    {currentParte.totalTime} min
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {currentParte.totalActuaciones} act.
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isNew && (
                            <>
                                <button
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors shadow-sm"
                                    onClick={() => setCommandPaletteOpen(true)}
                                    type="button"
                                >
                                    <Search className="w-4 h-4" />
                                    <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold">⌘K</kbd>
                                </button>
                                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                                    <button
                                        onClick={handlePrevParte}
                                        disabled={currentIndex === -1 || currentIndex >= partes.length - 1}
                                        className="p-1.5 text-slate-500 hover:text-slate-700 disabled:opacity-30 border-r border-slate-200 dark:border-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        title="Parte anterior"
                                        type="button"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleNextParte}
                                        disabled={currentIndex <= 0}
                                        className="p-1.5 text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        title="Parte siguiente"
                                        type="button"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        )}
                        {!isNew && (
                            <Button type="submit" form="parte-form" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20">
                                <Save className="w-4 h-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">Guardar</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Import cards for new partes */}
            {isNew && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => !isUploading && !isBulkUploading && singleInputRef.current?.click()}
                        className={clsx(
                            "group relative overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur rounded-[1.75rem] p-5 border-2 border-dashed transition-all duration-300 cursor-pointer",
                            isUploading ? "border-blue-500 bg-blue-50/30" : "border-blue-100 dark:border-blue-900/30 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10"
                        )}
                    >
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileUp className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Cargar PDF</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Revisa los datos antes de guardar</p>
                            </div>
                        </div>
                        <input type="file" ref={singleInputRef} className="hidden" accept=".pdf" onChange={handleSingleUpload} onClick={(e) => e.stopPropagation()} />
                    </div>

                    <div
                        onClick={() => !isUploading && !isBulkUploading && bulkInputRef.current?.click()}
                        className={clsx(
                            "group relative overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur rounded-[1.75rem] p-5 border-2 border-dashed transition-all duration-300 cursor-pointer",
                            isBulkUploading ? "border-orange-500 bg-orange-50/30" : "border-orange-100 dark:border-orange-900/30 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10"
                        )}
                    >
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                                {isBulkUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Files className="w-6 h-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Carga Masiva</h3>
                                    <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Varios</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Importa varios PDF a la vez</p>
                            </div>
                        </div>
                        <input type="file" ref={bulkInputRef} className="hidden" accept=".pdf" multiple onChange={handleBulkUpload} onClick={(e) => e.stopPropagation()} />
                    </div>
                </div>
            )}

            {/* Existing parte: two-column workspace */}
            {!isNew && currentParte ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    {/* LEFT: actuaciones */}
                    <div className="xl:col-span-8 space-y-4">
                        <Card className="!p-5 md:!p-6">
                            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Actuaciones</h2>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                        Alt+N nueva · ⌘↵ guardar
                                    </p>
                                </div>
                                <div className="flex gap-1.5">
                                    <Button onClick={handleExportActuaciones} variant="outline" size="sm" className="px-2 sm:px-3" title="Informe">
                                        <Printer className="w-4 h-4 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Informe</span>
                                    </Button>
                                    <Button
                                        onClick={handleCopyEmail}
                                        variant="outline"
                                        size="sm"
                                        className={clsx("px-2 sm:px-3 transition-all duration-300", showCopied ? "border-green-500 text-green-600 bg-green-50" : "")}
                                        title="Copiar Email"
                                    >
                                        {showCopied ? <Check className="w-4 h-4 sm:mr-1.5" /> : <Copy className="w-4 h-4 sm:mr-1.5" />}
                                        <span className="hidden sm:inline">{showCopied ? '¡Copiado!' : 'Email'}</span>
                                    </Button>
                                    {!showAddActuacion && (
                                        <Button
                                            onClick={() => openActuacionForm(null)}
                                            size="sm"
                                            className="px-3 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20"
                                        >
                                            <Plus className="w-4 h-4 sm:mr-1.5" />
                                            <span className="hidden sm:inline">Nueva</span>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div ref={formAnchorRef}>
                                {showAddActuacion ? (
                                    <div className="mb-5">
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
                                            key={editingActuacion?.id || 'new'}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => openActuacionForm(null)}
                                        className="w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-50/80 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/60 text-slate-500 hover:text-orange-600 border border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-400 transition-all font-bold text-sm group"
                                    >
                                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Nueva Actuación
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[min(55vh,560px)] overflow-y-auto pr-1 -mr-1">
                                <ActuacionesList
                                    actuaciones={currentParte.actuaciones}
                                    onDelete={async (actuacionId) => {
                                        if (window.confirm('¿Estás seguro de que quieres eliminar esta actuación?')) {
                                            await deleteActuacion(currentParte.id, actuacionId);
                                        }
                                    }}
                                    onEdit={handleEditClick}
                                    onDuplicate={async (actuacion) => {
                                        const { id: _ignoredId, ...actuacionSinId } = actuacion;
                                        void _ignoredId;
                                        const now = new Date();
                                        const localIso = toLocalISOString(now);
                                        const formattedNow = localIso.replace('T', ' ') + (localIso.includes(':') && localIso.split(':').length === 2 ? ':00' : '');

                                        await addActuacion(currentParte.id, {
                                            ...actuacionSinId,
                                            timestamp: formattedNow
                                        });
                                    }}
                                />
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT: metadata sidebar */}
                    <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-28">
                        <Card className="!p-5">
                            <button
                                type="button"
                                onClick={() => setIsDatosOpen(v => !v)}
                                className="w-full flex items-start justify-between gap-3 text-left"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Datos Generales</h2>
                                        {!currentParte.pdfFile && !uploadedPdf && (
                                            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                                <FileWarning className="w-3 h-3" />
                                                SIN PDF
                                            </span>
                                        )}
                                    </div>
                                    {!isDatosOpen && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed truncate">
                                            {formattedParteDate}
                                            {selectedClientName ? ` · ${selectedClientName}` : ''}
                                            {title ? ` · ${title}` : ''}
                                        </p>
                                    )}
                                </div>
                                <ChevronDown className={clsx("w-5 h-5 text-slate-400 shrink-0 transition-transform", isDatosOpen && "rotate-180")} />
                            </button>

                            {isDatosOpen ? (
                                <div className="mt-5 space-y-5">
                                    {!currentParte.pdfFile && !uploadedPdf && (
                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl flex items-start gap-3">
                                            <FileWarning className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-orange-800 dark:text-orange-400">Creado manualmente, sin PDF</p>
                                                <Button
                                                    onClick={() => !isUploading && singleInputRef.current?.click()}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isUploading}
                                                >
                                                    <FileUp className="w-3 h-3 mr-2" />
                                                    Vincular PDF
                                                </Button>
                                                <input type="file" ref={singleInputRef} className="hidden" accept=".pdf" onChange={handleSingleUpload} onClick={(e) => e.stopPropagation()} />
                                            </div>
                                        </div>
                                    )}
                                    {datosGeneralesForm}
                                </div>
                            ) : (
                                <div className="sr-only" aria-hidden>
                                    {datosGeneralesForm}
                                </div>
                            )}
                        </Card>

                        <Card className="!p-5">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Documentos PDF</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Abierto</p>
                                    {currentParte.pdfFile ? (
                                        <Button variant="outline" className="w-full" size="sm" onClick={handleViewPdf}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver Abierto
                                        </Button>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const base64 = reader.result as string;
                                                        if (currentParte) updateParte(currentParte.id, { pdfFile: base64 });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                                className="hidden"
                                                id="upload-pdf-manual"
                                            />
                                            <Button variant="outline" className="w-full cursor-pointer" size="sm" type="button" onClick={() => document.getElementById('upload-pdf-manual')?.click()}>
                                                <FileUp className="w-4 h-4 mr-2" />
                                                Subir Abierto
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Cerrado / Firmado</p>
                                    {currentParte.pdfFileSigned ? (
                                        <Button variant="primary" className="w-full" size="sm" onClick={handleViewSignedPdf}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver Cerrado
                                        </Button>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const base64 = reader.result as string;
                                                        if (currentParte) updateParte(currentParte.id, { pdfFileSigned: base64 });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                                className="hidden"
                                                id="upload-pdf-signed"
                                            />
                                            <Button variant="outline" className="w-full cursor-pointer text-slate-500" size="sm" type="button" onClick={() => document.getElementById('upload-pdf-signed')?.click()}>
                                                <FileUp className="w-4 h-4 mr-2" />
                                                Subir Firmado
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="!p-5">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Participantes</h3>
                                <div className="flex -space-x-2">
                                    {Array.from(new Set(currentParte.actuaciones.map(a => a.user))).map((userName) => {
                                        const userObj = users.find(u => (u.user_metadata?.full_name || u.name) === userName || u.email === userName);
                                        const hasAvatar = userObj?.avatar_url;
                                        return (
                                            <div key={userName} className="relative z-10" title={userName}>
                                                {hasAvatar ? (
                                                    <img src={userObj.avatar_url} alt={userName} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-[10px] text-orange-700 dark:text-orange-200 font-bold uppercase ring-2 ring-white dark:ring-slate-900">
                                                        {userName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {currentParte.actuaciones.length === 0 && (
                                        <span className="text-xs text-slate-400">Sin actuaciones</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {currentParte.status !== 'CERRADO' ? (
                                    <Button
                                        type="button"
                                        variant="danger"
                                        className="w-full"
                                        onClick={() => updateParteStatus(currentParte.id, 'CERRADO')}
                                        disabled={currentParte.actuaciones.length === 0}
                                    >
                                        Cerrar Parte
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" className="w-full" onClick={() => updateParteStatus(currentParte.id, 'EN TRÁMITE')}>
                                        Reabrir Parte
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={handleDeleteParte}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar Parte
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                /* New parte form */
                <Card className="!p-6 max-w-3xl mx-auto">
                    <h2 className="text-lg font-semibold mb-5 text-slate-800 dark:text-slate-100">Datos Generales</h2>
                    {datosGeneralesForm}
                </Card>
            )}
        </div>
    );
};
