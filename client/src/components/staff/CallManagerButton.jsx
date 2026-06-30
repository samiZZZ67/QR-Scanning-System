import { useState } from 'react';
import { BellRing, Send } from 'lucide-react';
import { createManagerNotification } from '../../api/notifications.js';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Modal from '../ui/Modal.jsx';
import Notice from '../ui/Notice.jsx';

const DEFAULT_REASON = 'Manager assistance requested';

export default function CallManagerButton({
  staffRole = 'Staff',
  assignedFloor = '',
  onNotice,
  className = ''
}) {
  const storageKey = `manager_call_staff_name_${staffRole}`;
  const [open, setOpen] = useState(false);
  const [staffName, setStaffName] = useState(
    () => sessionStorage.getItem(storageKey) || ''
  );
  const [floor, setFloor] = useState(assignedFloor ? String(assignedFloor) : '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanName = staffName.trim();
    const cleanReason = reason.trim();

    if (!cleanName) {
      setError('Staff name is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createManagerNotification({
        staffName: cleanName,
        staffRole,
        assignedFloor: floor ? Number(floor) : undefined,
        reason: cleanReason || DEFAULT_REASON
      });
      sessionStorage.setItem(storageKey, cleanName);
      setReason('');
      setOpen(false);
      onNotice?.({
        type: 'success',
        message: 'Manager notification sent.'
      });
    } catch (err) {
      const message = err.message || 'Failed to notify manager.';
      setError(message);
      onNotice?.({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<BellRing size={15} />}
        onClick={() => setOpen(true)}
        className={className}
      >
        Call Manager
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Call Manager"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Notice
              type="error"
              message={error}
              onDismiss={() => setError('')}
            />
          )}

          <Input
            label="Staff Name"
            value={staffName}
            onChange={(event) => setStaffName(event.target.value)}
            placeholder="Your name"
            autoFocus
            required
          />

          <Input
            label="Floor"
            type="number"
            min="1"
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            placeholder="Optional"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="manager-reason" className="text-sm font-medium text-rough">
              Reason
            </label>
            <textarea
              id="manager-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gold-muted bg-surface px-3 py-2 text-sm text-rough placeholder:text-gold-muted resize-none focus:outline-none focus:border-gold"
              placeholder="Guest escalation, shortage, override..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              icon={<Send size={15} />}
            >
              Send
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
