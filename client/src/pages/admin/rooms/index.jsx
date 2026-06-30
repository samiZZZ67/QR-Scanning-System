import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Edit2, Trash2, QrCode, Download, Printer } from 'lucide-react';
import { listFloors } from '../../../api/floors.js';
import { listRooms, addRoom, updateRoom, deleteRoom } from '../../../api/rooms.js';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';

export default function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    roomNumber: '',
    floor: ''
  });

  const qrContainerRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [roomsData, floorsData] = await Promise.all([listRooms(), listFloors()]);
      setRooms(roomsData || []);
      setFloors(floorsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setForm({ roomNumber: '', floor: floors[0]?.number.toString() || '' });
    setShowModal(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.number.toString(),
      floor: room.floor.toString()
    });
    setShowModal(true);
  };

  const handleOpenQr = (room) => {
    setSelectedRoom(room);
    setShowQrModal(true);
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Are you sure you want to delete room ${room.roomNumber}?`)) return;
    try {
      await deleteRoom(room.id);
      setRooms(prev => prev.filter(r => r.id !== room.id));
      setNotice({ type: 'success', message: `Room ${room.roomNumber} deleted successfully.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete room.' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomNum = form.roomNumber.trim();
    const floorNum = Number(form.floor);

    if (!roomNum) {
      setNotice({ type: 'error', message: 'Room number is required.' });
      return;
    }
    if (!floorNum) {
      setNotice({ type: 'error', message: 'Floor is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roomNumber: roomNum,
        floor: floorNum
      };

      if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, payload);
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? updated : r));
        setNotice({ type: 'success', message: `Room ${roomNum} updated successfully.` });
      } else {
        const created = await addRoom(payload);
        setRooms(prev => [...prev, created]);
        setNotice({ type: 'success', message: `Room ${roomNum} added successfully.` });
      }
      setShowModal(false);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to save room.' });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = () => {
    if (!selectedRoom || !qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector('svg');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `room-${selectedRoom.roomNumber}-qr.png`;
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svg.outerHTML)}`;
  };

  const printQR = () => {
    if (!selectedRoom || !qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector('svg');
    const printWindow = window.open('', '', 'height=400,width=600');
    printWindow.document.write(`
      <html><head><title>Room ${selectedRoom.roomNumber} QR Code</title></head>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;">
        ${svg.outerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading && !rooms.length) {
    return <LoadingSpinner text="Loading rooms" />;
  }

  return (
    <div className="space-y-4">
      {error && <Notice type="error" message={error} />}
      {notice && <Notice type={notice.type} message={notice.message} />}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Rooms</h2>
        <Button icon={Plus} onClick={handleOpenAdd}>
          Add Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No rooms configured yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => (
            <Card key={room.id} className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Room {room.roomNumber}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {room.floorName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={QrCode}
                    onClick={() => handleOpenQr(room)}
                    className="flex-1"
                  >
                    QR
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(room)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => handleDelete(room)}
                    className="text-red-500"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoom ? 'Edit Room' : 'Add Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Room Number"
            name="roomNumber"
            value={form.roomNumber}
            onChange={handleFormChange}
            placeholder="e.g., 301"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Floor
            </label>
            <select
              name="floor"
              value={form.floor}
              onChange={handleFormChange}
              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select a floor</option>
              {floors.map(f => (
                <option key={f.id} value={f.number}>
                  {f.name} (#{f.number})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={selectedRoom ? `Room ${selectedRoom.roomNumber} QR Code` : 'QR Code'}
        size="sm"
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div
              ref={qrContainerRef}
              className="flex justify-center p-4 bg-white rounded"
            >
              <QRCodeSVG
                value={selectedRoom.qrUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {selectedRoom.qrUrl}
            </p>
            <div className="flex gap-2">
              <Button icon={Download} onClick={downloadQR} className="flex-1">
                Download
              </Button>
              <Button icon={Printer} onClick={printQR} className="flex-1">
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
