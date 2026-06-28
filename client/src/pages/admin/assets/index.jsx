import React, { useState, useEffect, useRef } from 'react';
import { Image, Upload, Link, AlertTriangle } from 'lucide-react';
import { listAssets, updateAsset, uploadImage } from '../../../api/assets.js';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';
import OptimizedImage from '../../../components/ui/OptimizedImage.jsx';

export default function AssetsTab() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Upload/Edit State
  const [uploadingKey, setUploadingKey] = useState(null);
  const [editingUrlKey, setEditingUrlKey] = useState(null);
  const [urlInput, setUrlInput] = useState('');

  const fileInputRef = useRef(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAssets();
      setAssets(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch configurable assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const triggerFileUpload = (key) => {
    setUploadingKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingKey) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Image file size exceeds the 5MB limit.' });
      setUploadingKey(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setNotice(null);
      try {
        // Upload image JSON payload
        const uploadResult = await uploadImage({ dataUrl: base64 });
        const imageUrl = uploadResult.url;
        const imageThumbnail = uploadResult.thumbnail || imageUrl;

        // Update the asset
        await updateAsset(uploadingKey, {
          url: imageUrl,
          thumbnail: imageThumbnail,
          publicId: uploadResult.publicId || ''
        });

        setNotice({ type: 'success', message: 'Asset image uploaded and updated successfully.' });
        fetchAssets();
      } catch (err) {
        setNotice({ type: 'error', message: err.message || 'Image upload failed.' });
      } finally {
        setUploadingKey(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset file input
  };

  const handleUrlSave = async (key) => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setNotice(null);
    try {
      await updateAsset(key, {
        url: urlInput.trim(),
        thumbnail: urlInput.trim(),
        publicId: ''
      });
      setNotice({ type: 'success', message: 'Asset URL set successfully.' });
      setEditingUrlKey(null);
      setUrlInput('');
      fetchAssets();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update asset URL' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Asset Manager</h2>
          <p className="text-sm text-gold-muted mt-1">Configure hotel landing banners, logos, and UI hero assets.</p>
        </div>
      </div>

      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          className="my-3"
        />
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Retrieving app assets..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      ) : assets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted">
          <AlertTriangle size={36} className="text-gold-muted/40 mb-2" />
          <p className="font-display font-medium text-rough text-lg">No Configurable Assets</p>
          <p className="text-sm">There are no configurable app assets seeded in this system environment.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map(asset => (
            <Card key={asset.key} className="p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-rough text-lg">
                  {asset.label || asset.key}
                </h3>
                <p className="text-xs text-gold-muted font-sans mt-0.5">Key Ident: {asset.key}</p>
                <div className="mt-4 rounded-xl overflow-hidden aspect-video border border-gold-muted/30 bg-pale">
                  <OptimizedImage
                    src={asset.url}
                    alt={asset.label || asset.key}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gold-muted/15">
                {editingUrlKey === asset.key ? (
                  <div className="space-y-2">
                    <Input
                      label="Asset Image URL"
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUrlSave(asset.key)}>
                        Save URL
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingUrlKey(null); setUrlInput(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => triggerFileUpload(asset.key)}
                      loading={uploadingKey === asset.key}
                      className="flex-1"
                    >
                      <Upload size={14} className="mr-1.5" />
                      Upload Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingUrlKey(asset.key); setUrlInput(asset.url); }}
                      className="flex-1"
                    >
                      <Link size={14} className="mr-1.5" />
                      Specify URL
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
