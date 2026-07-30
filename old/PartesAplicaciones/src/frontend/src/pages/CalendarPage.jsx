import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US'; // Or es for Spanish
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ParteModal from '../components/ParteModal';
import { useAuth } from '../context/AuthContext';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchPartes();
    }, []);

    const fetchPartes = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/partes');
            const data = await response.json();
            const formattedEvents = data.map(parte => ({
                title: `${parte.numeroParte} - ${parte.estado}`,
                start: new Date(parte.fecha),
                end: new Date(parte.fecha), // Assuming single day events for now
                allDay: true,
                resource: parte
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching partes:', error);
        }
    };

    const handleSelectSlot = ({ start }) => {
        setSelectedDate(start);
        setIsModalOpen(true);
    };

    const handleSaveParte = async (parteData) => {
        try {
            const response = await fetch('http://localhost:5001/api/partes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parteData),
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchPartes(); // Refresh events
            }
        } catch (error) {
            console.error('Error saving parte:', error);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
                <button
                    onClick={() => {
                        setSelectedDate(new Date());
                        setIsModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition"
                >
                    Add Parte
                </button>
            </div>

            <div className="flex-1 bg-white p-4 rounded-lg shadow overflow-hidden">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    views={['month', 'week', 'day']}
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor: event.resource.estado === 'ABIERTO' ? '#F97316' :
                                event.resource.estado === 'CERRADO' ? '#10B981' : '#3B82F6',
                        }
                    })}
                />
            </div>

            <ParteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveParte}
                selectedDate={selectedDate}
                user={user}
            />
        </div>
    );
};

export default CalendarPage;
