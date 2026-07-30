import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ParteModal = ({ isOpen, onClose, onSave, selectedDate, user }) => {
    const [formData, setFormData] = useState({
        numeroParte: '',
        infocentro: '',
        estado: 'ABIERTO',
        usuario: user?.username || '',
        fecha: '',
        hora: '',
        actuaciones: [{ descripcion: '', tiempo: 0 }],
        parte: '',
        tiempo: 0
    });

    useEffect(() => {
        if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                fecha: selectedDate.toISOString().split('T')[0],
                hora: selectedDate.toTimeString().split(' ')[0].substring(0, 5)
            }));
        }
    }, [selectedDate]);

    // Calculate total time whenever actuations change
    useEffect(() => {
        const total = formData.actuaciones.reduce((sum, act) => sum + (parseInt(act.tiempo) || 0), 0);
        setFormData(prev => ({ ...prev, tiempo: total }));
    }, [formData.actuaciones]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleActuacionChange = (index, field, value) => {
        const newActuaciones = [...formData.actuaciones];
        newActuaciones[index][field] = value;
        setFormData(prev => ({ ...prev, actuaciones: newActuaciones }));
    };

    const addActuacion = () => {
        setFormData(prev => ({
            ...prev,
            actuaciones: [...prev.actuaciones, { descripcion: '', tiempo: 0 }]
        }));
    };

    const removeActuacion = (index) => {
        if (formData.actuaciones.length > 1) {
            const newActuaciones = formData.actuaciones.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, actuaciones: newActuaciones }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Nuevo Parte</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº Parte</label>
                        <input
                            type="text"
                            name="numeroParte"
                            value={formData.numeroParte}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Infocentro</label>
                        <input
                            type="text"
                            name="infocentro"
                            value={formData.infocentro}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                        >
                            <option value="ABIERTO">ABIERTO</option>
                            <option value="CERRADO">CERRADO</option>
                            <option value="TRASLADADO">TRASLADADO</option>
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            name="usuario"
                            value={formData.usuario}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary bg-gray-50"
                            readOnly
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <input
                            type="time"
                            name="hora"
                            value={formData.hora}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Actuaciones</label>
                        {formData.actuaciones.map((act, index) => (
                            <div key={index} className="flex gap-2 mb-2 items-start">
                                <input
                                    type="text"
                                    placeholder="Descripción"
                                    value={act.descripcion}
                                    onChange={(e) => handleActuacionChange(index, 'descripcion', e.target.value)}
                                    className="flex-grow p-2 border rounded focus:ring-primary focus:border-primary"
                                />
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={act.tiempo}
                                    onChange={(e) => handleActuacionChange(index, 'tiempo', e.target.value)}
                                    className="w-20 p-2 border rounded focus:ring-primary focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeActuacion(index)}
                                    className="p-2 text-red-500 hover:text-red-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addActuacion}
                            className="text-sm text-primary hover:text-primary-dark font-medium"
                        >
                            + Añadir Actuación
                        </button>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Parte</label>
                        <textarea
                            name="parte"
                            value={formData.parte}
                            onChange={handleChange}
                            rows="3"
                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Total (min)</label>
                        <input
                            type="number"
                            name="tiempo"
                            value={formData.tiempo}
                            readOnly
                            className="w-full p-2 border rounded bg-gray-50 font-bold text-gray-700"
                        />
                    </div>

                    <div className="col-span-2 flex justify-end space-x-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                        >
                            Save Parte
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ParteModal;
