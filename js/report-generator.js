class ReportGenerator {
    constructor() {
        this.templates = {
            students: 'Reporte de Estudiantes',
            grades: 'Reporte de Calificaciones',
            attendance: 'Reporte de Asistencia',
            performance: 'Reporte de Rendimiento Académico',
            summary: 'Resumen Ejecutivo'
        };
        this.formats = ['pdf', 'excel', 'csv'];
    }

    // Generar reporte en formato PDF
    async generatePDF(reportType, data, options = {}) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuración del documento
            const config = {
                title: this.templates[reportType] || 'Reporte',
                date: new Date().toLocaleDateString('es-ES'),
                institution: options.institution || 'Sistema Educativo',
                ...options
            };

            // Encabezado del reporte
            this.addPDFHeader(doc, config);
            
            // Contenido según tipo de reporte
            switch(reportType) {
                case 'students':
                    this.addStudentsReport(doc, data, config);
                    break;
                case 'grades':
                    this.addGradesReport(doc, data, config);
                    break;
                case 'attendance':
                    this.addAttendanceReport(doc, data, config);
                    break;
                case 'performance':
                    this.addPerformanceReport(doc, data, config);
                    break;
                case 'summary':
                    this.addSummaryReport(doc, data, config);
                    break;
                default:
                    this.addGenericReport(doc, data, config);
            }

            // Pie de página
            this.addPDFFooter(doc, config);
            
            // Descargar archivo
            const filename = `${reportType}_${Date.now()}.pdf`;
            doc.save(filename);
            
            return {
                success: true,
                filename,
                message: 'Reporte PDF generado exitosamente'
            };
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generar reporte en formato Excel
    async generateExcel(reportType, data, options = {}) {
        try {
            const workbook = XLSX.utils.book_new();
            
            // Configuración del reporte
            const config = {
                title: this.templates[reportType] || 'Reporte',
                date: new Date().toLocaleDateString('es-ES'),
                ...options
            };

            // Crear hojas según tipo de reporte
            switch(reportType) {
                case 'students':
                    this.addStudentsSheet(workbook, data, config);
                    break;
                case 'grades':
                    this.addGradesSheet(workbook, data, config);
                    break;
                case 'attendance':
                    this.addAttendanceSheet(workbook, data, config);
                    break;
                case 'performance':
                    this.addPerformanceSheet(workbook, data, config);
                    break;
                case 'summary':
                    this.addSummarySheet(workbook, data, config);
                    break;
                default:
                    this.addGenericSheet(workbook, data, config);
            }

            // Generar archivo Excel
            const filename = `${reportType}_${Date.now()}.xlsx`;
            XLSX.writeFile(workbook, filename);
            
            return {
                success: true,
                filename,
                message: 'Reporte Excel generado exitosamente'
            };
            
        } catch (error) {
            console.error('Error generando Excel:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Métodos para PDF
    addPDFHeader(doc, config) {
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(config.title, 20, 30);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Institución: ${config.institution}`, 20, 45);
        doc.text(`Fecha: ${config.date}`, 20, 55);
        
        // Línea separadora
        doc.line(20, 65, 190, 65);
    }

    addStudentsReport(doc, students, config) {
        let yPosition = 80;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Lista de Estudiantes', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Encabezados de tabla
        doc.text('ID', 20, yPosition);
        doc.text('Nombre', 40, yPosition);
        doc.text('Email', 100, yPosition);
        doc.text('Curso', 150, yPosition);
        yPosition += 10;
        
        // Datos de estudiantes
        students.forEach(student => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 30;
            }
            
            doc.text(student.id.toString(), 20, yPosition);
            doc.text(student.name || 'N/A', 40, yPosition);
            doc.text(student.email || 'N/A', 100, yPosition);
            doc.text(student.course || 'N/A', 150, yPosition);
            yPosition += 8;
        });
    }

    addGradesReport(doc, grades, config) {
        let yPosition = 80;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Reporte de Calificaciones', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Estadísticas generales
        const stats = this.calculateGradeStats(grades);
        doc.text(`Promedio General: ${stats.average.toFixed(2)}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Calificación Máxima: ${stats.max}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Calificación Mínima: ${stats.min}`, 20, yPosition);
        yPosition += 15;
        
        // Tabla de calificaciones
        doc.text('Estudiante', 20, yPosition);
        doc.text('Materia', 80, yPosition);
        doc.text('Calificación', 130, yPosition);
        doc.text('Estado', 160, yPosition);
        yPosition += 10;
        
        grades.forEach(grade => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 30;
            }
            
            doc.text(grade.studentName || 'N/A', 20, yPosition);
            doc.text(grade.subject || 'N/A', 80, yPosition);
            doc.text(grade.score?.toString() || 'N/A', 130, yPosition);
            doc.text(grade.score >= 70 ? 'Aprobado' : 'Reprobado', 160, yPosition);
            yPosition += 8;
        });
    }

    addPDFFooter(doc, config) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, 170, 285);
            doc.text(`Generado el ${config.date}`, 20, 285);
        }
    }

    // Métodos para Excel
    addStudentsSheet(workbook, students, config) {
        const wsData = [
            [config.title],
            [`Fecha: ${config.date}`],
            [],
            ['ID', 'Nombre', 'Email', 'Curso', 'Fecha Registro']
        ];
        
        students.forEach(student => {
            wsData.push([
                student.id,
                student.name || 'N/A',
                student.email || 'N/A',
                student.course || 'N/A',
                student.registrationDate || 'N/A'
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Aplicar estilos
        ws['A1'].s = { font: { bold: true, sz: 16 } };
        
        XLSX.utils.book_append_sheet(workbook, ws, 'Estudiantes');
    }

    addGradesSheet(workbook, grades, config) {
        const stats = this.calculateGradeStats(grades);
        
        const wsData = [
            [config.title],
            [`Fecha: ${config.date}`],
            [],
            ['Estadísticas Generales'],
            [`Promedio: ${stats.average.toFixed(2)}`],
            [`Máximo: ${stats.max}`],
            [`Mínimo: ${stats.min}`],
            [],
            ['Estudiante', 'Materia', 'Calificación', 'Estado', 'Fecha']
        ];
        
        grades.forEach(grade => {
            wsData.push([
                grade.studentName || 'N/A',
                grade.subject || 'N/A',
                grade.score || 0,
                grade.score >= 70 ? 'Aprobado' : 'Reprobado',
                grade.date || 'N/A'
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Calificaciones');
    }

    // Utilidades
    calculateGradeStats(grades) {
        if (!grades || grades.length === 0) {
            return { average: 0, max: 0, min: 0 };
        }
        
        const scores = grades.map(g => g.score || 0).filter(s => s > 0);
        
        return {
            average: scores.reduce((a, b) => a + b, 0) / scores.length,
            max: Math.max(...scores),
            min: Math.min(...scores)
        };
    }

    // Generar reporte personalizado
    async generateCustomReport(template, data, format = 'pdf', options = {}) {
        try {
            if (format === 'pdf') {
                return await this.generatePDF(template, data, options);
            } else if (format === 'excel') {
                return await this.generateExcel(template, data, options);
            } else {
                throw new Error('Formato no soportado');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Instancia global
window.reportGenerator = new ReportGenerator();