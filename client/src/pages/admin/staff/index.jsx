import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { listFloors } from '../../../api/floors.js';
import { listStaffMembers, createStaffMember, updateStaffMember, deleteStaffMember, setStaffOnline } from '../../../api/staff.js';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';

export default function StaffTab() {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    role: '',
    assignedFloor: ''
  });

  // Track the server's last-known updatedAt for optimistic conflict detection
  const [editingUpdatedAt, setEditingUpdatedAt] = useState(null);

  const ROLES = ['Waiter', 'Chef', 'Manager', 'Kitchen Staff', 'Host'];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [staffData, floorsData] = await Promise.all([listStaffMembers(), listFloors()]);
      setStaff(staffData || []);
      setFloors(floorsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      toast.error(err.message || 'Failed to load staff data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setEditingUpdatedAt(null);
    setForm({ name: '', role: '', assignedFloor: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setEditingStaff(member);
    setEditingUpdatedAt(member.updatedAt || null);
    setForm({
      name: member.name,
      role: member.role,
      assignedFloor: member.assignedFloor?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (member) => {
    const confirmed = await toast.confirm({
      title: 'Remove staff member?',
      message: `This will permanently remove ${member.name} from the system. This action cannot be undone.`,
      confirmLabel: 'Yes, Remove',
      cancelLabel: 'Keep',
    });
    if (!confirmed) return;
    try {
      await deleteStaffMember(member.id);
      setStaff(prev => prev.filter(s => s.id !== member.id));
      toast.success(`${member.name} removed successfully.`);
    } catch (err) {
      toast.error(err.message || 'Failed to remove staff member.');
    }
  };

  const handleToggleOnline = async (member) => {
    try {
      const updated = await setStaffOnline(member.id, !member.online);
      setStaff(prev => prev.map(s => s.id === member.id ? updated : s));
      toast.info(`${member.name} marked ${updated.online ? 'online' : 'offline'}.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update online status.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Name is required.');
      return;
    }
    if (!form.role) {
      toast.warning('Role is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        assignedFloor: form.assignedFloor ? Number(form.assignedFloor) : null
      };

      if (editingStaff) {
        // ── Optimistic conflict check ──────────────────────────────────────────
        // Re-fetch the current record to detect if it was modified since we opened the form
        const freshList = await listStaffMembers();
        const freshRecord = freshList?.find(s => s.id === editingStaff.id);
        if (
          freshRecord &&
          editingUpdatedAt &&
          freshRecord.updatedAt &&
          freshRecord.updatedAt !== editingUpdatedAt
        ) {
          toast.error(
            'This record was modified by someone else while you were editing. Please refresh and try again.',
            'Edit Conflict Detected'
          );
          setSubmitting(false);
          return;
        }

        const updated = await updateStaffMember(editingStaff.id, payload);
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? updated : s));
        toast.success(`${payload.name} updated successfully.`);
      } else {
        const created = await createStaffMember(payload);
        setStaff(prev => [...prev, created]);
        toast.success(`${payload.name} added to staff.`);
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedStaff = staff.reduce((acc, member) => {
    const key = member.assignedFloor ? `Floor ${member.assignedFloor}` : 'Kitchen';
    if (!acc[key]) acc[key] = [];
    acc[key].push(member);
    return acc;
  }, {});

  if (loading && !staff.length) {
    return <LoadingSpinner text="Loading staff" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Staff Management</h2>
          <p className="text-sm text-gold-muted mt-1">Manage hotel staff, roles, and floor assignments.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button icon={<Plus size={15} />} onClick={handleOpenAdd}>
            Add Staff
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {staff.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gold-muted">No staff members added yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedStaff).sort().map(([location, members]) => (
            <div key={location}>
              <h3 className="font-display font-semibold text-rough mb-3 text-base">
                {location}
              </h3>
              <div className="grid gap-3">
                {members.map(member => (
                  <Card key={member.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-rough">
                          {member.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={member.online ? 'success' : 'default'}>
                            {member.online ? 'Online' : 'Offline'}
                          </Badge>
                          <span className="text-sm text-body">
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          title={member.online ? 'Mark offline' : 'Mark online'}
                          onClick={() => handleToggleOnline(member)}
                          className="p-2 rounded-lg text-gold-muted hover:text-rough hover:bg-pale-light transition-colors"
                        >
                          {member.online ? <LogOut size={15} /> : <LogIn size={15} />}
                        </button>
                        <button
                          title="Edit"
                          onClick={() => handleOpenEdit(member)}
                          className="p-2 rounded-lg text-gold-muted hover:text-rough hover:bg-pale-light transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          title="Remove"
                          onClick={() => handleDelete(member)}
                          className="p-2 rounded-lg text-gold-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="e.g., John Doe"
            required
          />
          <div>
            <label className="block text-sm font-medium text-rough mb-1">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gold-muted rounded-xl bg-surface text-rough focus:outline-none focus:ring-1 focus:ring-gold"
              required
            >
              <option value="">Select a role</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-rough mb-1">
              Assigned Floor <span className="text-gold-muted">(optional)</span>
            </label>
            <select
              name="assignedFloor"
              value={form.assignedFloor}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gold-muted rounded-xl bg-surface text-rough focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Kitchen / No Assignment</option>
              {floors.map(f => (
                <option key={f.id} value={f.number}>
                  {f.name} (#{f.number})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Saving…' : editingStaff ? 'Save Changes' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
