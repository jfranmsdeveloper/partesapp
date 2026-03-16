import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ChevronLeft, Save, Plus, Trash2, FileUp, Loader2, FileText, Eye, Printer, Copy, Check, Files, FileWarning } from 'lucide-react';
import { clsx } from 'clsx';
import type { ActuacionType } from '../../types';
import { parsePartePDF } from '../../utils/pdfParser';

import { toLocalISOString } from '../../utils/dateUtils';

export const ParteEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id;

    const { partes, addParte, addActuacion, updateActuacion, deleteActuacion, deleteParte, updateParteStatus, updateParte, currentUser, users, upsertClientFromPDF, linkPdfToParte } = useUserStore();

    const [title, setTitle] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [customId, setCustomId] = useState('');
    const [customDate, setCustomDate] = useState(toLocalISOString(new Date())); // Default to now (Local)


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


    const currentParte = id ? partes.find(p => String(p.id) === String(id)) : undefined;

    // Initialize form if editing
    useEffect(() => {
        if (currentParte) {
            setTitle(currentParte.title);
            setCreatedBy(currentParte.createdBy);
            setCustomId(currentParte.id.toString());
            setCustomDate(toLocalISOString(new Date(currentParte.createdAt)));
            setSelectedClientId(currentParte.clientId || '');
            // Note: We don't load the full PDF into state to save memory unless needed, 
            // but for "viewing" we rely on currentParte.pdfFile
        }
    }, [currentParte]);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(''); // New state for progress text

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
        setUploadStatus('Iniciando...');
        try {
            const data = await parsePartePDF(file, (status) => setUploadStatus(status));

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

            // ... (rest of logic for NEW partes)
            if (data.createdBy) {
                setUploadStatus('Registrando solicitante...');
                const clientId = await upsertClientFromPDF(data.createdBy, data.createdByCode);
                if (clientId) {
                    setSelectedClientId(clientId);
                }
            }

            // Construct date time if available
            if (data.date) {
                const [d, m, y] = data.date.split(/[-/]/);
                const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                let timeStr = data.time || '09:00';
                setCustomDate(`${dateStr}T${timeStr}`);
            }

            alert('✅ Datos extraídos correctamente.');
        } catch (error) {
            console.error(error);
            alert('❌ Error al procesar el PDF.');
        } finally {
            setIsUploading(false);
            setUploadStatus('');
            e.target.value = '';
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            let processed = 0;
            for (const file of files) {
                processed++;
                setUploadStatus(`Procesando ${processed} de ${files.length}: ${file.name}`);

                const data = await parsePartePDF(file);

                // Create client if needed
                let clientId = '';
                if (data.createdBy) {
                    clientId = await upsertClientFromPDF(data.createdBy, data.createdByCode) || '';
                }

                // Format date
                let formattedDate = toLocalISOString(new Date()).replace('T', ' ') + ':00';
                if (data.date) {
                    const [d, m, y] = data.date.split(/[-/]/);
                    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    const timeStr = data.time || '09:00';
                    const dt = `${dateStr}T${timeStr}`;
                    formattedDate = dt.replace('T', ' ') + (dt.includes(':') && dt.split(':').length === 2 ? ':00' : '');
                }

                // Add the parte directly
                await addParte({
                    title: data.title || file.name,
                    status: 'ABIERTO',
                    createdBy: currentUser?.user_metadata?.full_name || currentUser?.name || 'Sistema',
                    id: data.id || undefined,
                    createdAt: formattedDate,
                    pdfFile: data.pdfFile,
                    clientId: clientId || undefined
                });
            }

            alert(`✅ Se han importado ${files.length} partes correctamente.`);
            navigate('/management');
        } catch (error) {
            console.error(error);
            alert('❌ Error en el proceso masivo.');
        } finally {
            setIsUploading(false);
            setUploadStatus('');
            e.target.value = '';
        }
    };

    const handleAddOrUpdateActuacion = async (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string }) => {
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
        setShowAddActuacion(false);
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

    const handleEditClick = (actuacion: any) => {
        setEditingActuacion({ id: actuacion.id, data: actuacion });
        setShowAddActuacion(true);
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
                                onChange={(e) => {
                                    const newStatus = e.target.value as any;
                                    if (newStatus === 'CERRADO' && currentParte.actuaciones.length === 0) {
                                        alert('⚠️ No se puede cerrar un parte sin actuaciones. Añade al menos una actuación.');
                                        return;
                                    }
                                    updateParteStatus(currentParte.id, newStatus);
                                }}
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

            {/* Main Form Layout - Refactored to Vertical Stack (90% Width) */}
            <div className="flex flex-col items-center w-full gap-8 pb-20">

                {/* 2. Actuaciones (Only if !isNew) */}
                {!isNew && currentParte && (
                    <div className="w-[90%] max-w-7xl">
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

                            <div className="mb-6">
                                <ActuacionesList
                                    actuaciones={currentParte.actuaciones}
                                    onDelete={async (actuacionId) => {
                                        if (window.confirm('¿Estás seguro de que quieres eliminar esta actuación?')) {
                                            await deleteActuacion(currentParte.id, actuacionId);
                                        }
                                    }}
                                    onEdit={handleEditClick}
                                />
                            </div>

                            {showAddActuacion && (
                                <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
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
                        </Card>
                    </div>
                )}

                {/* 3. Resumen (Original) */}
                {!isNew && currentParte && (
                    <div className="w-[90%] max-w-7xl">
                        <Card>
                            <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                            <div className="flex flex-col md:flex-row gap-8 justify-around items-center p-4">
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm uppercase font-bold tracking-wider mb-1">Total Tiempo</span>
                                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100 flex items-start">
                                        {currentParte.totalTime}
                                        <span className="text-lg text-slate-400 font-bold ml-1 mt-1">min</span>
                                    </span>
                                </div>
                                <div className="w-px h-16 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm uppercase font-bold tracking-wider mb-1">Actuaciones</span>
                                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100">
                                        {currentParte.totalActuaciones}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}


                {/* 1. Datos Generales (Always Visible) */}
                <div className="w-[90%] max-w-7xl">
                    <Card>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            Datos Generales
                            {!isNew && !uploadedPdf && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <FileWarning className="w-3 h-3" />
                                    SIN PDF
                                </span>
                            )}
                        </h2>

                        {!isNew && !uploadedPdf && (
                            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl flex items-start gap-3">
                                <FileWarning className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-400">Este parte fue creado manualmente</p>
                                    <p className="text-xs text-orange-700 dark:text-orange-500/80">
                                        No tiene un PDF asociado. Puedes subir uno ahora para vincularlo. Se actualizará el ID del parte pero se mantendrán los datos actuales.
                                    </p>
                                    <Button 
                                        onClick={() => !isUploading && singleInputRef.current?.click()}
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-2"
                                        disabled={isUploading}
                                    >
                                        <FileUp className="w-3 h-3 mr-2" />
                                        Vincular PDF
                                    </Button>
                                    <input
                                        type="file"
                                        ref={singleInputRef}
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={handleSingleUpload}
                                    />
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
                                        <Button variant="primary" className="w-full" onClick={handleViewSignedPdf}>
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
                            {/* Row 1: Key Metadata (Full Width usage) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                <div className="md:col-span-2">
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
                                <div className="md:col-span-3">
                                    <DatePicker
                                        label="Fecha Creación"
                                        value={customDate.split('T')[0]}
                                        onChange={(date) => {
                                            const time = customDate.split('T')[1] || '09:00';
                                            setCustomDate(`${date}T${time}`);
                                        }}
                                    />
                                </div>
                                <div className="md:col-span-2">
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
                                <div className="md:col-span-5">
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
                                                className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 placeholder:text-slate-400"
                                            >
                                                <option value="" disabled>
                                                    {createdBy === 'Usuario Actual' ? 'Selecciona el usuario correcto' : 'Selecciona un usuario'}
                                                </option>
                                                {users.map((u) => {
                                                    const name = u.user_metadata?.full_name || u.name || u.email;
                                                    return <option key={u.id} value={name}>{name}</option>
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

                            {/* Row 2: Title */}
                            <div className="mb-6">
                                <ClientSelect
                                    label="Solicitado por (Usuario / Empleado)"
                                    value={selectedClientId}
                                    onChange={setSelectedClientId}
                                    disabled={false} // Always editable?
                                />
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
                                <Button type="submit" className="w-full md:w-auto md:px-12 md:py-3 text-lg bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
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
                </div>

                {/* 4. Footer Actions (Only if !isNew) */}
                {!isNew && currentParte && (
                    <div className="w-[90%] max-w-7xl flex flex-col sm:flex-row justify-between items-center py-6 border-t border-slate-100 dark:border-slate-800/50 gap-4">
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
                                <div className="flex gap-3">
                                    {currentParte.status !== 'CERRADO' && (
                                        <Button
                                            type="button"
                                            variant="danger"
                                            onClick={() => {
                                                console.log('Close button clicked');
                                                updateParteStatus(currentParte.id, 'CERRADO');
                                            }}
                                            disabled={currentParte.actuaciones.length === 0}
                                        >
                                            Cerrar Parte
                                        </Button>
                                    )}
                                    {currentParte.status === 'CERRADO' && (
                                        <Button type="button" variant="outline" onClick={() => updateParteStatus(currentParte.id, 'EN TRÁMITE')}>
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
