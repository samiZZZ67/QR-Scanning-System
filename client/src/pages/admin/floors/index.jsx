import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { listFloors, addFloor, updateFloor, deleteFloor } from '../../../api/floors.js';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';

export default function FloorsTab() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    number: '',
    description: ''
  });

  const fetchFloors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listFloors();
      setFloors(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  const handleOpenAdd = () => {
    setEditingFloor(null);
    setForm({ name: '', number: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (floor) => {
    setEditingFloor(floor);
    setForm({
      name: floor.name,
      number: floor.number.toString(),
      description: floor.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (floor) => {
    if (!window.confirm(`Are you sure you want to delete floor ${floor.name}?`)) return;
    try {
      await deleteFloor(floor.id);
      setFloors(prev => prev.filter(f => f.id !== floor.id));
      setNotice({ type: 'success', message: `Floor ${floor.name} deleted successfully.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete floor.' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const floorNum = Number(form.number);
    if (!form.name.trim()) {
      setNotice({ type: 'error', message: 'Floor name is required.' });
      return;
    }
    if (!floorNum || floorNum < 1) {
      setNotice({ type: 'error', message: 'Floor number must be at least 1.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        number: floorNum,
        description: form.description.trim()
      };

      if (editingFloor) {
        const updated = await updateFloor(editingFloor.id, payload);
        setFloors(prev => prev.map(f => f.id === editingFloor.id ? updated : f));
        setNotice({ type: 'success', message: `${payload.name} updated successfully.` });
      } else {
        const created = await addFloor(payload);
        setFloors(prev => [...prev, created]);
        setNotice({ type: 'success', message: `${payload.name} added successfully.` });
      }
      setShowModal(false);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to save floor.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !floors.length) {
    return <LoadingSpinner text="Loading floors" />;
  }

  return (
    <div className="space-y-4">
      {error && <Notice type="error" message={error} />}
      {notice && <Notice type={notice.type} message={notice.message} />}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Floors</h2>
        <Button icon={Plus} onClick={handleOpenAdd}>
          Add Floor
        </Button>
      </div>

      {floors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No floors configured yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {floors.map(floor => (
            <Card key={floor.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {floor.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Floor #{floor.number}
                  </p>
                  {floor.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {floor.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(floor)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => handleDelete(floor)}
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
        title={editingFloor ? 'Edit Floor' : 'Add Floor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Floor Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="e.g., Ground Floor"
            required
          />
          <Input
            label="Floor Number"
            name="number"
            type="number"
            value={form.number}
            onChange={handleFormChange}
            placeholder="e.g., 1"
            min="1"
            required
          />
          <Input
            label="Description (optional)"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            placeholder="e.g., Main dining area"
          />
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
    </div>
  );
}
