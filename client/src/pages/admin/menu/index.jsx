import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Check, X, AlertTriangle } from 'lucide-react';
import { api } from '../../../api/client.js';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import { TableRowsSkeleton } from '../../../components/ui/Skeleton.jsx';
import OptimizedImage from '../../../components/ui/OptimizedImage.jsx';
import Card from '../../../components/ui/Card.jsx';
import { formatMoney } from '../../../utils/formatting.js';

export default function MenuTab() {
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nameEn: '',
    nameAm: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAm: '',
    descriptionAr: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    prepMinutes: 0,
    popular: false,
    chefPick: false,
    available: true,
    sortOrder: 0
  });

  const fetchMenu = async () => {
    setLoading(true);
    setError('');
    try {
      // Pass includeUnavailable to load everything
      const data = await api('/menu?includeUnavailable=true');
      setMenu({
        categories: data.categories || [],
        items: data.items || []
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      nameEn: '',
      nameAm: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAm: '',
      descriptionAr: '',
      price: '',
      categoryId: menu.categories[0]?.id || '',
      imageUrl: '',
      prepMinutes: 0,
      popular: false,
      chefPick: false,
      available: true,
      sortOrder: 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      nameEn: item.name?.en || '',
      nameAm: item.name?.am || '',
      nameAr: item.name?.ar || '',
      descriptionEn: item.description?.en || '',
      descriptionAm: item.description?.am || '',
      descriptionAr: item.description?.ar || '',
      price: item.price.toString(),
      categoryId: item.categoryId || '',
      imageUrl: item.image || '',
      prepMinutes: item.prepMinutes || 0,
      popular: !!item.popular,
      chefPick: !!item.chefPick,
      available: item.available !== false,
      sortOrder: item.sortOrder || 0
    });
    setShowModal(true);
  };

  const handleToggleAvailable = async (item) => {
    try {
      const nextAvailable = !item.available;
      await api(`/menu-items/${item.id}`, {
        method: 'PATCH',
        body: { available: nextAvailable }
      });
      setMenu(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, available: nextAvailable } : i)
      }));
      setNotice({ type: 'success', message: `Availability updated for "${item.name?.en || item.name}"` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update item' });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name?.en || item.name}"?`)) return;
    try {
      await api(`/menu-items/${item.id}`, { method: 'DELETE' });
      setMenu(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== item.id)
      }));
      setNotice({ type: 'success', message: `Deleted menu item successfully` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete item' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn || !form.price) {
      setNotice({ type: 'error', message: 'Name (EN) and Price are required.' });
      return;
    }

    setSubmitting(true);
    const payload = {
      categoryId: Number(form.categoryId),
      name: {
        en: form.nameEn,
        am: form.nameAm || form.nameEn,
        ar: form.nameAr || form.nameEn
      },
      description: {
        en: form.descriptionEn,
        am: form.descriptionAm || form.descriptionEn,
        ar: form.descriptionAr || form.descriptionEn
      },
      price: Number(form.price),
      image: form.imageUrl,
      prepMinutes: Number(form.prepMinutes),
      popular: form.popular,
      chefPick: form.chefPick,
      available: form.available,
      sortOrder: Number(form.sortOrder)
    };

    try {
      if (editingItem) {
        await api(`/menu-items/${editingItem.id}`, {
          method: 'PATCH',
          body: payload
        });
        setNotice({ type: 'success', message: 'Menu item updated successfully.' });
      } else {
        await api('/menu-items', {
          method: 'POST',
          body: payload
        });
        setNotice({ type: 'success', message: 'New menu item created.' });
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Error saving menu item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = menu.items.filter(item => {
    const matchesSearch =
      (item.name?.en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name?.am || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCatId === 'all' || Number(item.categoryId) === Number(selectedCatId);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Menu Management</h2>
          <p className="text-sm text-gold-muted mt-1">Manage food items, descriptions, pricing, and display settings.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus size={16} className="mr-1.5" />
          Add Menu Item
        </Button>
      </div>

      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          className="my-3"
        />
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface p-4 rounded-xl border border-gold-muted/30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-muted" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-pale-light border border-gold-muted/50 rounded-lg text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="w-full bg-pale-light border border-gold-muted/50 rounded-lg px-3 py-2 text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="all">All Categories</option>
            {menu.categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name?.en || cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <LoadingSpinner size="sm" text="Retrieving menu items" />
          <TableRowsSkeleton rows={6} />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted">
          <AlertTriangle size={36} className="text-gold-muted/40 mb-2" />
          <p className="font-display font-medium text-rough text-lg">No Items Found</p>
          <p className="text-sm">Create a new menu item or adjust filters to begin.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-pale-light rounded-2xl border border-gold-muted/35 shadow-card">
          <table className="min-w-full divide-y divide-gold-muted/20">
            <thead className="bg-surface/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gold uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-muted/15">
              {filteredItems.map(item => {
                const cat = menu.categories.find(c => c.id === item.categoryId);
                const catName = cat?.name?.en || 'Unknown';
                return (
                  <tr key={item.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-pale border border-gold-muted/30">
                        <OptimizedImage
                          src={item.image || item.imageUrl}
                          alt={item.name?.en}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-rough">{item.name?.en}</div>
                      <div className="text-xs text-gold-muted font-sans mt-0.5">{item.name?.am || item.name?.ar}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                      {catName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gold">
                      {formatMoney(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={[
                          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer select-none transition-all duration-200',
                          item.available
                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                        ].join(' ')}
                      >
                        {item.available ? (
                          <>
                            <Check size={12} />
                            Available
                          </>
                        ) : (
                          <>
                            <X size={12} />
                            Sold Out
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-pale text-gold hover:text-gold-hover transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Multi-language names */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Name (English) *"
              name="nameEn"
              value={form.nameEn}
              onChange={handleFormChange}
              required
              placeholder="e.g. Doro Wot"
            />
            <Input
              label="Name (Amharic)"
              name="nameAm"
              value={form.nameAm}
              onChange={handleFormChange}
              placeholder="e.g. ዶሮ ወጥ"
            />
            <Input
              label="Name (Arabic)"
              name="nameAr"
              value={form.nameAr}
              onChange={handleFormChange}
              placeholder="e.g. دورو ووت"
            />
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-rough">Description (English)</label>
              <textarea
                name="descriptionEn"
                value={form.descriptionEn}
                onChange={handleFormChange}
                rows={3}
                className="w-full bg-surface border border-gold-muted px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-gold resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-rough">Description (Amharic)</label>
              <textarea
                name="descriptionAm"
                value={form.descriptionAm}
                onChange={handleFormChange}
                rows={3}
                className="w-full bg-surface border border-gold-muted px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-gold resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-rough">Description (Arabic)</label>
              <textarea
                name="descriptionAr"
                value={form.descriptionAr}
                onChange={handleFormChange}
                rows={3}
                className="w-full bg-surface border border-gold-muted px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-gold resize-none"
              />
            </div>
          </div>

          {/* Pricing, Category, Prep Time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Price (ETB) *"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleFormChange}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-rough">Category *</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleFormChange}
                required
                className="w-full bg-surface border border-gold-muted rounded-xl px-3 py-2 text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {menu.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name?.en || cat.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Prep Minutes"
              name="prepMinutes"
              type="number"
              min="0"
              value={form.prepMinutes}
              onChange={handleFormChange}
            />
            <Input
              label="Sort Order"
              name="sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={handleFormChange}
            />
          </div>

          {/* Image URL */}
          <Input
            label="Image URL"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleFormChange}
            placeholder="Paste unsplash or external image URL"
          />

          {/* Settings checkboxes */}
          <div className="flex flex-wrap gap-6 bg-surface p-4 rounded-xl border border-gold-muted/30">
            <label className="flex items-center gap-2 text-sm font-medium text-rough cursor-pointer select-none">
              <input
                type="checkbox"
                name="popular"
                checked={form.popular}
                onChange={handleFormChange}
                className="rounded text-gold focus:ring-gold border-gold-muted/50"
              />
              Mark as Popular 🔥
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-rough cursor-pointer select-none">
              <input
                type="checkbox"
                name="chefPick"
                checked={form.chefPick}
                onChange={handleFormChange}
                className="rounded text-gold focus:ring-gold border-gold-muted/50"
              />
              Chef's Pick 👨‍🍳
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-rough cursor-pointer select-none">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleFormChange}
                className="rounded text-gold focus:ring-gold border-gold-muted/50"
              />
              Available for Ordering
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold-muted/20">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
