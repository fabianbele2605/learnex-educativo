// Gestor de Calendario Académico
if (typeof window.CalendarManager === 'undefined') {
class CalendarManager {
    constructor() {
        this.events = JSON.parse(localStorage.getItem('calendar_events') || '[]');
        this.currentDate = new Date();
    }
    
    addEvent(event) {
        const newEvent = {
            id: Date.now().toString(),
            title: event.title,
            date: event.date,
            type: event.type, // exam, assignment, event
            description: event.description || '',
            subjectId: event.subjectId || null,
            created_at: new Date().toISOString()
        };
        
        this.events.push(newEvent);
        this.saveEvents();
        return newEvent;
    }
    
    getEvents(month = null, year = null) {
        if (!month || !year) {
            return this.events;
        }
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getMonth() === month && eventDate.getFullYear() === year;
        });
    }
    
    getUpcomingEvents(days = 7) {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + days);
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now && eventDate <= future;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveEvents();
    }
    
    saveEvents() {
        localStorage.setItem('calendar_events', JSON.stringify(this.events));
    }
    
    generateCalendarHTML(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        let html = `
            <div class="calendar-header">
                <button class="btn btn-sm btn-outline" onclick="window.calendarManager.previousMonth()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3>${monthNames[month]} ${year}</h3>
                <button class="btn btn-sm btn-outline" onclick="window.calendarManager.nextMonth()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-days-header">
        `;
        
        // Días de la semana
        dayNames.forEach(day => {
            html += `<div class="day-header">${day}</div>`;
        });
        
        html += '</div><div class="calendar-days">';
        
        // Espacios vacíos para el primer día
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = this.events.filter(e => e.date === dateStr);
            const isToday = this.isToday(date);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-events">
                        ${dayEvents.slice(0, 2).map(event => 
                            `<div class="event-dot ${event.type}" title="${event.title}"></div>`
                        ).join('')}
                        ${dayEvents.length > 2 ? `<div class="more-events">+${dayEvents.length - 2}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div></div>';
        return html;
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
    
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }
    
    renderCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer) {
            calendarContainer.innerHTML = this.generateCalendarHTML(
                this.currentDate.getMonth(),
                this.currentDate.getFullYear()
            );
        }
    }
}

window.CalendarManager = CalendarManager;
}