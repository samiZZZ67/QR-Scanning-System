import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Utensils, Flame, Coffee, HelpCircle } from 'lucide-react';
import { api } from '../../../api/client.js';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';

const ICONS = {
  Utensils: Utensils,
  Flame: Flame,
  Coffee: Coffee,
  HelpCircle: HelpCircle
};

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nameEn: '',
    nameAm: '',
    nameAr: '',
    icon: 'Utensils',
    sortOrder: 0
  });

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/menu');
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm({
      nameEn: '',
      nameAm: '',
      nameAr: '',
      icon: 'Utensils',
      sortOrder: 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      nameEn: cat.name?.en || '',
      nameAm: cat.name?.am || '',
      nameAr: cat.name?.ar || '',
      icon: cat.icon || 'Utensils',
      sortOrder: cat.sortOrder || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name?.en || cat.name}"?`)) return;
    try {
      await api(`/categories/${cat.id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setNotice({ type: 'success', message: 'Category deleted successfully.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete category.' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn) {
      setNotice({ type: 'error', message: 'Category Name (EN) is required.' });
      return;
    }

    setSubmitting(true);
    const payload = {
      name: {
        en: form.nameEn,
        am: form.nameAm || form.nameEn,
        ar: form.nameAr || form.nameEn
      },
      icon: form.icon,
      sortOrder: Number(form.sortOrder)
    };

    try {
      if (editingCategory) {
        await api(`/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: payload
        });
        setNotice({ type: 'success', message: 'Category updated successfully.' });
      } else {
        await api('/categories', {
          method: 'POST',
          body: payload
        });
        setNotice({ type: 'success', message: 'New category created.' });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Error saving category.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Menu Categories</h2>
          <p className="text-sm text-gold-muted mt-1">Organize your menu items into structured groups.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus size={16} className="mr-1.5" />
          Add Category
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
          <LoadingSpinner size="lg" text="Retrieving categories..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      ) : categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted">
          <Tag size={36} className="text-gold-muted/40 mb-2" />
          <p className="font-display font-medium text-rough text-lg">No Categories Yet</p>
          <p className="text-sm">Add your first category to start classifying items.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const Icon = ICONS[cat.icon] || ICONS.Utensils;
            return (
              <Card key={cat.id} className="p-5 flex items-start gap-4">
                <div className="p-3 bg-gold/15 rounded-xl border border-gold/25 text-gold shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-rough text-base leading-snug truncate">
                    {cat.name?.en || cat.name}
                  </h3>
                  <div className="text-xs text-gold-muted font-sans mt-0.5">
                    {cat.name?.am || '—'} / {cat.name?.ar || '—'}
                  </div>
                  <div className="text-xs text-body font-sans mt-2">
                    Sort Order: <span className="font-semibold">{cat.sortOrder || 0}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gold-muted/15">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-pale text-gold hover:text-gold-hover transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Category Name (English) *"
              name="nameEn"
              value={form.nameEn}
              onChange={handleFormChange}
              required
              placeholder="e.g. Traditional Food"
            />
            <Input
              label="Category Name (Amharic)"
              name="nameAm"
              value={form.nameAm}
              onChange={handleFormChange}
              placeholder="e.g. ባህላዊ ምግቦች"
            />
            <Input
              label="Category Name (Arabic)"
              name="nameAr"
              value={form.nameAr}
              onChange={handleFormChange}
              placeholder="e.g. أطباق تقليدية"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-rough">Icon Style</label>
              <select
                name="icon"
                value={form.icon}
                onChange={handleFormChange}
                className="w-full bg-surface border border-gold-muted rounded-xl px-3 py-2 text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="Utensils">Utensils 🍽️</option>
                <option value="Flame">Flame 🔥</option>
                <option value="Coffee">Coffee ☕</option>
                <option value="HelpCircle">Generic ❓</option>
              </select>
            </div>
            <Input
              label="Sort Order"
              name="sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={handleFormChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold-muted/20">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
