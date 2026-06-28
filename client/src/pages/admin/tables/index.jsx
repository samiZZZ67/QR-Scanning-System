import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, QrCode, Download, Printer, AlertTriangle } from 'lucide-react';
import { listTables, addTable, deleteTable } from '../../../api/tables.js';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';

export default function TablesTab() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    number: '',
    seats: '4'
  });

  const qrContainerRef = useRef(null);

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listTables();
      setTables(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenAdd = () => {
    setForm({ number: '', seats: '4' });
    setShowAddModal(true);
  };

  const handleOpenQr = (table) => {
    setSelectedTable(table);
    setShowQrModal(true);
  };

  const handleDelete = async (table) => {
    if (!window.confirm(`Are you sure you want to delete table ${table.number}?`)) return;
    try {
      await deleteTable(table.number);
      setTables(prev => prev.filter(t => t.number !== table.number));
      setNotice({ type: 'success', message: `Table ${table.number} deleted successfully.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete table.' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(form.number);
    if (!num || num < 100) {
      setNotice({ type: 'error', message: 'Table number must be at least 100 (e.g. 101 for Floor 1, 201 for Floor 2).' });
      return;
    }

    setSubmitting(true);
    try {
      await addTable({
        number: num,
        seats: Number(form.seats || 4)
      });
      setNotice({ type: 'success', message: `Table ${num} added successfully.` });
      setShowAddModal(false);
      fetchTables();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to add table.' });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = () => {
    if (!selectedTable) return;
    const svgElement = qrContainerRef.current?.querySelector('svg');
    if (!svgElement) return;

    // Convert SVG to canvas
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const context = canvas.getContext('2d');
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, 300, 300);
      context.drawImage(image, 0, 0, 300, 300);

      const pngURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngURL;
      downloadLink.download = `table_${selectedTable.number}_qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    const qrSvg = qrContainerRef.current?.innerHTML || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table ${selectedTable?.number} QR</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            h1 { font-size: 28px; margin-bottom: 20px; color: #1a0e05; }
            .qr-container { padding: 20px; border: 2px solid #785D32; border-radius: 12px; }
            p { font-size: 16px; margin-top: 15px; color: #785D32; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>Habesha Grand Hotel</h1>
          <div class="qr-container">${qrSvg}</div>
          <p>Scan to Order — Table ${selectedTable?.number}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const qrUrl = selectedTable
    ? `${window.location.origin}/order?table=${selectedTable.number}`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Table & QR Management</h2>
          <p className="text-sm text-gold-muted mt-1">Configure layout tables and generate ordering QR codes.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus size={16} className="mr-1.5" />
          Add Table
        </Button>
      </div>

      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          className="my-3"
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Retrieving tables..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      ) : tables.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted">
          <AlertTriangle size={36} className="text-gold-muted/40 mb-2" />
          <p className="font-display font-medium text-rough text-lg">No Tables Configured</p>
          <p className="text-sm">Create tables to generate digital menu guest links.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map(table => (
            <Card key={table.number} className="p-5 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-rough text-3xl">
                    T-{table.number}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold bg-gold/10 text-gold border border-gold/25 px-2 py-0.5 rounded">
                      Floor {table.floor}
                    </span>
                    <span className="text-xs text-gold-muted font-sans">
                      {table.seats} Seats Capacity
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-pale rounded-xl border border-gold-muted/30 text-gold-muted">
                  <QrCode size={24} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gold-muted/15">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenQr(table)}
                  className="flex-1"
                >
                  <QrCode size={14} className="mr-1.5" />
                  QR Link
                </Button>
                <button
                  onClick={() => handleDelete(table)}
                  className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                  title="Delete Table"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Layout Table"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Table Number *"
            name="number"
            type="number"
            required
            value={form.number}
            onChange={handleFormChange}
            placeholder="e.g. 101"
          />
          <p className="text-xs text-gold-muted leading-relaxed">
            Note: The dining floor is derived automatically. Use 3-digit numbers starting with floor number (e.g. 101 for Floor 1, 202 for Floor 2).
          </p>
          <Input
            label="Seats Capacity"
            name="seats"
            type="number"
            min="1"
            required
            value={form.seats}
            onChange={handleFormChange}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gold-muted/20">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Display Modal */}
      <Modal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={`Table ${selectedTable?.number} QR Code`}
        size="sm"
      >
        {selectedTable && (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div
              ref={qrContainerRef}
              className="p-5 bg-white border-2 border-gold rounded-2xl shadow-sm mb-4"
            >
              <QRCodeSVG
                value={qrUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-sm font-semibold text-rough mb-1">Floor {selectedTable.floor} • {selectedTable.seats} Seats</p>
            <p className="text-xs text-gold-muted break-all max-w-xs mb-6 select-all font-mono bg-pale p-2 rounded border border-gold-muted/20">
              {qrUrl}
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" size="sm" onClick={downloadQR} className="flex-1">
                <Download size={14} className="mr-1.5" />
                Download PNG
              </Button>
              <Button variant="primary" size="sm" onClick={printQR} className="flex-1">
                <Printer size={14} className="mr-1.5" />
                Print Sign
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
