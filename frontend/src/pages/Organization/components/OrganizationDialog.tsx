import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { DepartmentData, CategoryData, EmployeeData } from '../../../types/organization';

interface OrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'departments' | 'categories' | 'employees';
  item: any | null; // Selected item if editing, null if adding
  onSave: (data: any) => Promise<void>;
  
  // Master lists for selections
  departmentsList?: DepartmentData[];
  employeesList?: EmployeeData[];
}

export const OrganizationDialog: React.FC<OrganizationDialogProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onSave,
  departmentsList = [],
  employeesList = []
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State variables
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptParentId, setDeptParentId] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('');

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catFields, setCatFields] = useState('');

  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDeptId, setEmpDeptId] = useState('');

  // Sync state when dialog opens or selected item changes
  useEffect(() => {
    setErrorMsg(null);
    if (item) {
      if (type === 'departments') {
        setDeptName(item.name || '');
        setDeptCode(item.departmentCode || '');
        setDeptParentId(item.parentDepartmentId || '');
        setDeptHeadId(item.headEmployeeId || '');
      } else if (type === 'categories') {
        setCatName(item.name || '');
        setCatDesc(item.description || '');
        setCatFields(item.customFields || '');
      } else if (type === 'employees') {
        setEmpName(item.name || '');
        setEmpEmail(item.email || '');
        setEmpDeptId(item.departmentId || '');
      }
    } else {
      // Clear form for creation
      setDeptName('');
      setDeptCode('');
      setDeptParentId('');
      setDeptHeadId('');

      setCatName('');
      setCatDesc('');
      setCatFields('');

      setEmpName('');
      setEmpEmail('');
      setEmpDeptId('');
    }
  }, [item, type, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (type === 'departments') {
        if (!deptName.trim() || !deptCode.trim()) {
          throw new Error('Department Name and Code are required.');
        }
        await onSave({
          name: deptName.trim(),
          departmentCode: deptCode.trim(),
          parentDepartmentId: deptParentId || null,
          headEmployeeId: deptHeadId || null
        });
      } 
      
      else if (type === 'categories') {
        if (!catName.trim()) {
          throw new Error('Category Name is required.');
        }
        await onSave({
          name: catName.trim().toUpperCase(),
          description: catDesc.trim() || null,
          customFields: catFields.trim() || null
        });
      } 
      
      else if (type === 'employees') {
        if (!empName.trim() || !empEmail.trim()) {
          throw new Error('Employee Name and Email are required.');
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(empEmail)) {
          throw new Error('Please enter a valid email address.');
        }
        await onSave({
          name: empName.trim(),
          email: empEmail.trim(),
          departmentId: empDeptId || null
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enforce rule: Head Employee must belong to the department.
  // We filter the employees dropdown to users belonging to this department
  const eligibleHeads = item 
    ? employeesList.filter(emp => emp.departmentId === item.id)
    : []; // For new departments, no employee can belong to it yet.

  // Filter out self from parent list to prevent direct loops
  const eligibleParents = item
    ? departmentsList.filter(d => d.id !== item.id)
    : departmentsList;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {item ? 'Edit' : 'Add New'} {type === 'departments' ? 'Department' : type === 'categories' ? 'Asset Category' : 'Employee'}
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          
          {/* A. DEPARTMENT FORM */}
          {type === 'departments' && (
            <>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={deptName} 
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g., Software Engineering"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={deptCode} 
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g., ENG-SOFT"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Department</label>
                <select 
                  className="form-select" 
                  value={deptParentId} 
                  onChange={(e) => setDeptParentId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- None (Root Department) --</option>
                  {eligibleParents.filter(d => d.status === 'ACTIVE').map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.departmentCode})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department Head</label>
                {item ? (
                  eligibleHeads.length > 0 ? (
                    <select 
                      className="form-select" 
                      value={deptHeadId} 
                      onChange={(e) => setDeptHeadId(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Select Department Head --</option>
                      {eligibleHeads.filter(e => e.status === 'ACTIVE').map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      No employees are currently assigned to this department. Assign employees to this department first to designate a Head.
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    To set a department head, create the department first, add employees to it, and then assign a Head by editing the department.
                  </div>
                )}
              </div>
            </>
          )}

          {/* B. CATEGORY FORM */}
          {type === 'categories' && (
            <>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g., LAPTOP"
                  style={{ textTransform: 'uppercase' }}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  value={catDesc} 
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Describe assets under this category"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Custom Attributes (Comma Separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={catFields} 
                  onChange={(e) => setCatFields(e.target.value)}
                  placeholder="e.g., Warranty, SerialNumber, Processor"
                  disabled={isSubmitting}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Define custom attributes for assets in this category, separated by commas.
                </span>
              </div>
            </>
          )}

          {/* C. EMPLOYEE FORM */}
          {type === 'employees' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={empName} 
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g., Priya Sharma"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={empEmail} 
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="e.g., priya@assetflow.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Department</label>
                <select 
                  className="form-select" 
                  value={empDeptId} 
                  onChange={(e) => setEmpDeptId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- No Department Assigned --</option>
                  {departmentsList.filter(d => d.status === 'ACTIVE').map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.departmentCode})</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Note: Role promotion can be edited directly inline on the employee directory table.
                </span>
              </div>
            </>
          )}

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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
