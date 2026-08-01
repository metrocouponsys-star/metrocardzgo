import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal';
import type { MembershipType, CardInventoryItem } from '../../types';
import * as api from '../../api';
import { invalidateContaining } from '../../api/cache';

interface FormData {
  name: string;
  phone: string;
  date_of_birth: string;
  anniversary_date: string;
  family_dob_1?: string;
  family_dob_2?: string;
  family_dob_3?: string;
  membership_type_id: string;
  card_id: string;
  consent_received: boolean;
}

export default function AddMemberPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [availableCards, setAvailableCards] = useState<CardInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();

  useEffect(() => {
    api.getMembershipTypes(user?.merchant_id || '').then(setMembershipTypes);
    api.getMerchantCards(user?.merchant_id || '').then(cards =>
      setAvailableCards(cards.filter(c => c.status === 'merchant_allocated'))
    );
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setDuplicateId(null);
    try {
      const newMember = await api.createMember(user?.merchant_id || '', data);
      invalidateContaining('members');
      invalidateContaining('dashboard');
      // If a card was selected, link it immediately
      if (data.card_id) {
        try {
          await api.linkCardToMember(user?.merchant_id || '', data.card_id, newMember.id);
          addToast('success', `Member ${newMember.name} (${newMember.member_code}) enrolled with card!`);
        } catch {
          addToast('success', `Member ${newMember.name} enrolled — card linking failed, assign from Cards page.`);
        }
      } else {
        addToast('success', `Member ${newMember.name} (${newMember.member_code}) enrolled!`);
      }
      navigate(`/members/${newMember.id}`);
    } catch (e: any) {
      if (e.message === 'DUPLICATE_PHONE') {
        const existing = await api.searchMembers(user?.merchant_id || '', data.phone);
        if (existing[0]) setDuplicateId(existing[0].id);
        addToast('error', 'A member with this phone number already exists.');
      } else {
        addToast('error', 'Failed to add member. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleBulkImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const lines = csvText.trim().split('\n');
      const rows: any[] = [];
      // Parse CSV header & lines with flexible column mapping
      const headerParts = lines[0].toLowerCase().split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      let nameIdx = headerParts.findIndex(h => h.includes('name'));
      let phoneIdx = headerParts.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
      let dobIdx = headerParts.findIndex(h => h.includes('birth') || h.includes('dob'));
      let annivIdx = headerParts.findIndex(h => h.includes('anniversary'));

      const hasHeader = nameIdx !== -1 || phoneIdx !== -1;
      if (!hasHeader) {
        nameIdx = 0;
        phoneIdx = 1;
        dobIdx = 2;
        annivIdx = 3;
      } else {
        if (nameIdx === -1) nameIdx = 0;
        if (phoneIdx === -1) phoneIdx = 1;
      }

      const dataLines = hasHeader ? lines.slice(1) : lines;
      for (const line of dataLines) {
        if (!line.trim()) continue;
        const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        const name = parts[nameIdx];
        const phone = parts[phoneIdx];
        if (name && phone) {
          rows.push({
            name,
            phone,
            date_of_birth: (dobIdx !== -1 && parts[dobIdx]) ? parts[dobIdx] : undefined,
            anniversary_date: (annivIdx !== -1 && parts[annivIdx]) ? parts[annivIdx] : undefined,
          });
        }
      }

      if (rows.length === 0) {
        addToast('error', 'No valid rows found in CSV. Expected format: Name, Phone');
        setImporting(false);
        return;
      }

      const res = await api.bulkImportMembers(user?.merchant_id || '', rows);
      setImportResult(res);
      addToast('success', `Imported ${res.imported} members successfully!`);
    } catch {
      addToast('error', 'Failed to process CSV import');
    } finally {
      setImporting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const template = 'Name,Phone,DateOfBirth,AnniversaryDate\nRahul Sharma,9876543210,1990-05-15,2018-11-20\nPriya Patel,9876543211,1995-08-22,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 md:px-10 py-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-[#6B7280] hover:text-[#111111] text-sm transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          className="btn-outline flex items-center gap-2 !py-2 !px-4 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Bulk Import CSV
        </button>
      </div>

      <div className="page-header">
        <h2 className="page-title">Add New Member</h2>
        <p className="page-subtitle">Enroll a new customer individually or bulk import from CSV.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="form-label" htmlFor="name">Full Name *</label>
          <input
            id="name"
            className={`input-field ${errors.name ? 'border-error' : ''}`}
            placeholder="e.g. Arjun Sharma"
            {...register('name', { required: 'Full name is required' })}
          />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="form-label" htmlFor="phone">Mobile Number *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-base border-r border-[#E5E7EB] pr-3">+91</span>
            <input
              id="phone"
              type="tel"
              className={`input-field pl-[72px] ${errors.phone ? 'border-error' : ''}`}
              placeholder="98765 43210"
              maxLength={10}
              {...register('phone', {
                required: 'Mobile number is required',
                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit number' },
              })}
            />
          </div>
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
          {duplicateId && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <p className="text-amber-700 text-sm">This number is already registered.</p>
              <button type="button" onClick={() => navigate(`/members/${duplicateId}`)} className="text-[#B8941F] font-bold text-sm hover:underline">
                View Member →
              </button>
            </div>
          )}
        </div>

        {/* Membership Type */}
        <div>
          <label className="form-label" htmlFor="membership_type_id">Membership Type *</label>
          <select
            id="membership_type_id"
            className={`input-field ${errors.membership_type_id ? 'border-error' : ''}`}
            {...register('membership_type_id', { required: 'Please select a membership type' })}
          >
            <option value="">Select membership type...</option>
            {membershipTypes.map(mt => (
              <option key={mt.id} value={mt.id}>{mt.name} — {mt.description}</option>
            ))}
          </select>
          {errors.membership_type_id && <p className="text-red-600 text-xs mt-1">{errors.membership_type_id.message}</p>}
        </div>

        {/* DOB */}
        <div>
          <label className="form-label" htmlFor="dob">Date of Birth <span className="text-[#6B7280] font-normal">(for birthday reminders)</span></label>
          <input
            id="dob"
            type="date"
            className="input-field"
            {...register('date_of_birth')}
          />
        </div>

        {/* Anniversary */}
        <div>
          <label className="form-label" htmlFor="anniversary">Anniversary Date <span className="text-[#6B7280] font-normal">(optional — for anniversary reminders)</span></label>
          <input
            id="anniversary"
            type="date"
            className="input-field"
            {...register('anniversary_date')}
          />
        </div>

        {/* Family Member Birthdates (Up to 3) */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#B8941F] text-[20px]">family_restroom</span>
            <p className="text-sm font-bold text-[#111111]">Family Member Birth Dates <span className="text-xs font-normal text-[#6B7280]">(Up to 3 for family birthday offers)</span></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label text-[11px]" htmlFor="family_dob_1">Family Member 1</label>
              <input
                id="family_dob_1"
                type="date"
                className="input-field !text-xs"
                {...register('family_dob_1')}
              />
            </div>
            <div>
              <label className="form-label text-[11px]" htmlFor="family_dob_2">Family Member 2</label>
              <input
                id="family_dob_2"
                type="date"
                className="input-field !text-xs"
                {...register('family_dob_2')}
              />
            </div>
            <div>
              <label className="form-label text-[11px]" htmlFor="family_dob_3">Family Member 3</label>
              <input
                id="family_dob_3"
                type="date"
                className="input-field !text-xs"
                {...register('family_dob_3')}
              />
            </div>
          </div>
        </div>

        {/* Physical Card Assignment (optional) */}
        {availableCards.length > 0 && (
          <div>
            <label className="form-label" htmlFor="card_id">
              Assign Physical Card <span className="text-[#6B7280] font-normal">(optional — assign a pre-printed card now)</span>
            </label>
            <select
              id="card_id"
              className="input-field"
              {...register('card_id')}
            >
              <option value="">No card — assign later from Cards page</option>
              {availableCards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.card_number}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#6B7280] mt-1">{availableCards.length} cards available in your inventory</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-[#F3F4F6] rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#B8941F] text-[20px]">info</span>
          <div className="text-sm text-[#6B7280]">
            <p>A <strong>membership number</strong> and <strong>QR code</strong> will be automatically generated on save.</p>
          </div>
        </div>

        {/* Customer Privacy & Data Consent */}
        <div className="bg-primary/5 border border-[#B8941F]/20 rounded-xl p-4 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="consent_received"
              defaultChecked
              className="mt-1 h-4 w-4 rounded border-outline text-[#B8941F] focus:ring-[#B8941F]"
              {...register('consent_received', { required: 'Customer consent is required to register personal data.' })}
            />
            <span className="text-xs text-[#111111]">
              <strong>Customer Privacy Consent:</strong> Customer agrees to share their name & mobile number for loyalty point updates, reward offers, and account notifications via SMS/WhatsApp in accordance with DPDP Act data protection standards.
            </span>
          </label>
          {errors.consent_received && (
            <p className="text-red-600 text-xs pl-7">{errors.consent_received.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/members')} className="btn-secondary flex-1">Cancel</button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            {loading ? 'Adding Member...' : 'Save & Generate Card'}
          </button>
        </div>
      </form>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Import Members (CSV)"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#F3F4F6] p-3 rounded-xl">
            <span className="text-xs text-[#6B7280]">Download sample CSV format:</span>
            <button
              onClick={downloadCsvTemplate}
              className="text-[#B8941F] text-sm font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Template.csv
            </button>
          </div>

          <div>
            <label className="form-label">Paste CSV Content or Drag CSV Text</label>
            <p className="text-[10px] text-[#6B7280] mb-2">Columns: Name, Phone, DateOfBirth (optional), AnniversaryDate (optional)</p>
            <textarea
              rows={8}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={`Name,Phone,DateOfBirth,AnniversaryDate\nRahul Sharma,9876543210,1990-05-15,2018-11-20\nPriya Patel,9876543211,1995-08-22,`}
              className="w-full p-3 font-mono text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#B8941F]"
            />
          </div>

          {importResult && (
            <div className={`p-4 rounded-xl text-xs border ${importResult.skipped === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              <p className="font-bold">Import Summary:</p>
              <p>✅ Successfully imported: {importResult.imported}</p>
              {importResult.skipped > 0 && <p>⚠️ Skipped (duplicates/errors): {importResult.skipped}</p>}
              {importResult.errors.length > 0 && (
                <ul className="mt-2 text-[10px] list-disc pl-4 space-y-0.5">
                  {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowBulkModal(false)} className="btn-secondary">Close</button>
            <button
              onClick={handleBulkImport}
              disabled={importing || !csvText.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {importing && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Import Members
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


