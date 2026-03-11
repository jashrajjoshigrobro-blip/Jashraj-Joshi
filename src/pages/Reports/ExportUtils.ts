import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToPDF = (title: string, societyName: string, dateRange: string, columns: string[], data: any[][]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(societyName, 14, 15);
  
  doc.setFontSize(12);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Date Range: ${dateRange}`, 14, 28);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 33);
  
  autoTable(doc, {
    startY: 40,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });
  
  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportToExcel = (title: string, societyName: string, dateRange: string, columns: string[], data: any[][]) => {
  const wsData = [
    [societyName],
    [title],
    [`Date Range: ${dateRange}`],
    [`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`],
    [],
    columns,
    ...data
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
