import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { AssetData } from '../../../types/asset';
import type { CategoryData, DepartmentData } from '../../../types/organization';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssetData | null; // Selected asset if editing, null if adding
  onSave: (data: any) => Promise<void>;
  categoriesList: CategoryData[];
  departmentsList: DepartmentData[];
}

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  categoriesList,
  departmentsList
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('0');
  const [condition, setCondition] = useState('NEW');
  const [location, setLocation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [bookable, setBookable] = useState(false);

  // Document simulation states
  const [documents, setDocuments] = useState<Array<{ name: string; url: string }>>([]);
  const [newDocName, setNewDocName] = useState('');

  // Sync state when open or item changes
  useEffect(() => {
    setErrorMsg(null);
    if (item) {
      setName(item.name || '');
      setCategoryId(item.categoryId || '');
      setSerialNumber(item.serialNumber || '');
      setCondition(item.condition || 'NEW');
      setLocation(item.location || '');
      setDepartmentId(item.departmentId || '');
      setBookable(item.bookable || false);
      setPurchaseCost(item.purchaseCost ? item.purchaseCost.toString() : '0');
      
      if (item.purchaseDate) {
        // Format ISO date to YYYY-MM-DD
        const d = new Date(item.purchaseDate);
        setPurchaseDate(d.toISOString().substring(0, 10));
      } else {
        setPurchaseDate('');
      }

      setDocuments(item.documents || []);
    } else {
      setName('');
      setCategoryId('');
      setSerialNumber('');
      setPurchaseDate('');
      setPurchaseCost('0');
      setCondition('NEW');
      setLocation('');
      setDepartmentId('');
      setBookable(false);
      setDocuments([]);
    }
    setNewDocName('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    const docName = newDocName.trim();
    // Simulate invoice or warranty file paths
    const url = `/documents/${docName.toLowerCase().replace(/\s+/g, '_')}`;
    setDocuments([...documents, { name: docName, url }]);
    setNewDocName('');
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error('Asset Name is required.');
      if (!categoryId) throw new Error('Category is required.');

      const parsedCost = parseFloat(purchaseCost);
      if (isNaN(parsedCost) || parsedCost < 0) {
        throw new Error('Purchase Cost must be a valid positive number.');
      }

      await onSave({
        name: name.trim(),
        categoryId,
        serialNumber: serialNumber.trim() || null,
        location: location.trim() || null,
        condition,
        purchaseCost: parsedCost,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        bookable,
        departmentId: departmentId || null,
        documents // Send attached documents
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {item ? `Edit Asset: ${item.assetTag}` : 'Register New Asset'}
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Errors */}
        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="details-grid">
            {/* Asset Name */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Asset Name / Model</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dell Latitude 7420 Laptop"
                disabled={isSubmitting}
              />
            </div>

            {/* Category selection */}
            <div className="form-group">
              <label className="form-label">Asset Category</label>
              <select 
                className="form-select" 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">-- Select Category --</option>
                {categoriesList.filter(c => c.status === 'ACTIVE').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Serial Number */}
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={serialNumber} 
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., S/N or Service Tag"
                disabled={isSubmitting}
              />
            </div>

            {/* Purchase Date */}
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={purchaseDate} 
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Purchase Cost */}
            <div className="form-group">
              <label className="form-label">Purchase Cost (USD)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                value={purchaseCost} 
                onChange={(e) => setPurchaseCost(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Asset Condition */}
            <div className="form-group">
              <label className="form-label">Condition Rating</label>
              <select 
                className="form-select" 
                value={condition} 
                onChange={(e) => setCondition(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Physical Location</label>
              <input 
                type="text" 
                className="form-input" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Bengaluru HQ - Floor 2"
                disabled={isSubmitting}
              />
            </div>

            {/* Department owner assignment */}
            <div className="form-group">
              <label className="form-label">Assign Department</label>
              <select 
                className="form-select" 
                value={departmentId} 
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">-- Unassigned (Float Pool) --</option>
                {departmentsList.filter(d => d.status === 'ACTIVE').map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.departmentCode})</option>
                ))}
              </select>
            </div>

            {/* Bookable setting */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={bookable} 
                  onChange={(e) => setBookable(e.target.checked)}
                  disabled={isSubmitting}
                  style={{ width: '16px', height: '16px' }}
                />
                Eligible for Resource Booking
              </label>
            </div>
          </div>

          {/* Document Upload Simulator */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>Attached Invoices / Manuals</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Warranty_Card.pdf" 
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleAddDocument}
                disabled={isSubmitting}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Document Badges list */}
            {documents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <span>{doc.name}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveDocument(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Register Asset'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
