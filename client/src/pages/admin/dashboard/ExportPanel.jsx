import { FileText, FileJson, Printer } from 'lucide-react';
import Button from '../../../components/ui/Button.jsx';
import Card from '../../../components/ui/Card.jsx';

export function ExportPanel({ data }) {
  const handleExportCSV = () => {
    if (!data || !data.orders) return;
    const headers = ['Order ID', 'Table Number', 'Status', 'Total', 'Created At'];
    const rows = data.orders.map(o => [
      o.id,
      o.tableNumber,
      o.status,
      o.total,
      o.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hotel_orders_report_${data.range || 'custom'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hotel_report_${data.range || 'custom'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-rough text-lg">Export Report Data</h3>
          <p className="text-sm text-gold-muted mt-1">Download this report for external accounting, auditing, or print records.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileText size={16} className="mr-1.5" />
            CSV Format
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileJson size={16} className="mr-1.5" />
            JSON Format
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={16} className="mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ExportPanel;
