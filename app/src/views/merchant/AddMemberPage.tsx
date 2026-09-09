import React, { useEffect, useState, useMemo } from 'react';
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
  date_of_birth?: string;
  anniversary_date?: string;
  family_dob_1?: string;
  family_dob_2?: string;
  family_dob_3?: string;
  membership_type_id: string;
  card_id: string;
  initial_points?: string;
  consent_received: boolean;
}

export default function AddMemberPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [availableCards, setAvailableCards] = useState<CardInventoryItem[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>();
  const selectedCardId = watch('card_id');
  const watchDob = watch('date_of_birth');
  const watchAnniv = watch('anniversary_date');
  const watchFamily1 = watch('family_dob_1');
  const watchFamily2 = watch('family_dob_2');
  const watchFamily3 = watch('family_dob_3');

  const selectedCard = useMemo(() => {
    return availableCards.find(c => c.id === selectedCardId);
  }, [availableCards, selectedCardId]);

  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return availableCards;
    const q = cardSearch.replace(/\s/g, '').toLowerCase();
    return availableCards.filter((c, index) => {
      const rawNum = c.card_number.replace(/\s/g, '').toLowerCase();
      const seq = String(index + 1);
      return rawNum.includes(q) || seq === q || `#${seq}` === q;
    });
  }, [availableCards, cardSearch]);

  const handleCardSearchChange = (val: string) => {
    setCardSearch(val);
    let digits = val.replace(/\D/g, '');
    if (val.includes('?n=')) {
      const m = val.match(/[?&]n=([0-9]+)/);
      if (m) digits = m[1];
    }
    if (digits.length >= 16) {
      const match = availableCards.find(c => c.card_number.replace(/\D/g, '') === digits);
      if (match) {
        setValue('card_id', match.id, { shouldDirty: true, shouldValidate: true });
        addToast('success', `Card ${match.card_number} selected!`);
      }
    }
  };

  const handleCardSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCards.length > 0) {
        setValue('card_id', filteredCards[0].id, { shouldDirty: true, shouldValidate: true });
        addToast('success', `Card ${filteredCards[0].card_number} selected`);
      }
    }
  };

  useEffect(() => {
    api.getMembershipTypes(user?.merchant_id || '').then(setMembershipTypes);
    api.getMerchantCards(user?.merchant_id || '').then(cards => {
      const sorted = cards
        .filter(c => c.status === 'merchant_allocated')
        .sort((a, b) => a.card_number.localeCompare(b.card_number, undefined, { numeric: true, sensitivity: 'base' }));
      setAvailableCards(sorted);
      if (sorted.length > 0) {
        setValue('card_id', sorted[0].id);
      }
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setDuplicateId(null);
    try {
      const createPayload = {
        ...data,
        date_of_birth: data.date_of_birth?.trim() ? data.date_of_birth.trim() : undefined,
        anniversary_date: data.anniversary_date?.trim() ? data.anniversary_date.trim() : undefined,
        family_dob_1: data.family_dob_1?.trim() ? data.family_dob_1.trim() : undefined,
        family_dob_2: data.family_dob_2?.trim() ? data.family_dob_2.trim() : undefined,
        family_dob_3: data.family_dob_3?.trim() ? data.family_dob_3.trim() : undefined,
        initial_points: data.initial_points ? Number(data.initial_points) : undefined,
      };
      const newMember = await api.createMember(user?.merchant_id || '', createPayload as any);
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
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-body-md transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          className="btn-outline flex items-center gap-2 !py-2 !px-4 text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Bulk Import CSV
        </button>
      </div>

      <div className="page-header">
        <h2 className="page-title">Add New Member</h2>
        <p className="page-subtitle">Enroll a new customer individually or bulk import from CSV.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-lg space-y-md">
        {/* Name */}
        <div>
          <label className="form-label" htmlFor="name">Full Name *</label>
          <input
            id="name"
            className={`input-field ${errors.name ? 'border-error' : ''}`}
            placeholder="e.g. Arjun Sharma"
            {...register('name', { required: 'Full name is required' })}
          />
          {errors.name && <p className="text-error text-label-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="form-label" htmlFor="phone">Mobile Number *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-lg border-r border-outline-variant pr-3">+91</span>
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
          {errors.phone && <p className="text-error text-label-sm mt-1">{errors.phone.message}</p>}
          {duplicateId && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <p className="text-amber-700 text-body-md">This number is already registered.</p>
              <button type="button" onClick={() => navigate(`/members/${duplicateId}`)} className="text-primary font-bold text-label-md hover:underline">
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
          {errors.membership_type_id && <p className="text-error text-label-sm mt-1">{errors.membership_type_id.message}</p>}
        </div>

        {/* DOB */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label mb-0" htmlFor="dob">
              Date of Birth
            </label>
            <div className="flex items-center gap-2">
              {watchDob && (
                <button
                  type="button"
                  onClick={() => setValue('date_of_birth', '', { shouldDirty: true })}
                  className="text-label-xs text-on-surface-variant hover:text-error transition-colors"
                >
                  Clear
                </button>
              )}
              <span className="text-on-surface-variant font-normal text-label-xs bg-surface-container px-2 py-0.5 rounded-full">
                Optional · for birthday greetings
              </span>
            </div>
          </div>
          <input
            id="dob"
            type="date"
            className="input-field"
            {...register('date_of_birth')}
          />
        </div>

        {/* Anniversary */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label mb-0" htmlFor="anniversary">
              Anniversary Date
            </label>
            <div className="flex items-center gap-2">
              {watchAnniv && (
                <button
                  type="button"
                  onClick={() => setValue('anniversary_date', '', { shouldDirty: true })}
                  className="text-label-xs text-on-surface-variant hover:text-error transition-colors"
                >
                  Clear
                </button>
              )}
              <span className="text-on-surface-variant font-normal text-label-xs bg-surface-container px-2 py-0.5 rounded-full">
                Optional · for anniversary greetings
              </span>
            </div>
          </div>
          <input
            id="anniversary"
            type="date"
            className="input-field"
            {...register('anniversary_date')}
          />
        </div>

        {/* Family Member Birthdates (Up to 3) - 100% Optional */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md space-y-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">family_restroom</span>
              <p className="text-label-md font-bold text-on-surface">
                Family Member Birth Dates <span className="text-body-sm font-normal text-on-surface-variant">(Up to 3)</span>
              </p>
            </div>
            <span className="text-on-surface-variant font-normal text-label-xs bg-surface-container px-2 py-0.5 rounded-full">
              100% Optional · for family greetings
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-label-xs mb-0" htmlFor="family_dob_1">
                  Family Member 1 <span className="text-on-surface-variant font-normal">(Optional)</span>
                </label>
                {watchFamily1 && (
                  <button
                    type="button"
                    onClick={() => setValue('family_dob_1', '', { shouldDirty: true })}
                    className="text-[10px] text-on-surface-variant hover:text-error transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="family_dob_1"
                type="date"
                className="input-field !text-body-sm"
                {...register('family_dob_1')}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-label-xs mb-0" htmlFor="family_dob_2">
                  Family Member 2 <span className="text-on-surface-variant font-normal">(Optional)</span>
                </label>
                {watchFamily2 && (
                  <button
                    type="button"
                    onClick={() => setValue('family_dob_2', '', { shouldDirty: true })}
                    className="text-[10px] text-on-surface-variant hover:text-error transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="family_dob_2"
                type="date"
                className="input-field !text-body-sm"
                {...register('family_dob_2')}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-label-xs mb-0" htmlFor="family_dob_3">
                  Family Member 3 <span className="text-on-surface-variant font-normal">(Optional)</span>
                </label>
                {watchFamily3 && (
                  <button
                    type="button"
                    onClick={() => setValue('family_dob_3', '', { shouldDirty: true })}
                    className="text-[10px] text-on-surface-variant hover:text-error transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="family_dob_3"
                type="date"
                className="input-field !text-body-sm"
                {...register('family_dob_3')}
              />
            </div>
          </div>
          <p className="text-label-xs text-on-surface-variant mt-1">
            All family birthday fields are completely optional. Cashiers can leave these blank and enroll the member directly.
          </p>
        </div>

        {/* Physical Card Assignment (with search and sequential order) */}
        {availableCards.length > 0 && (
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md space-y-3">
            {/* Header with Title and "Next in Stack" Quick Button */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="form-label mb-0" htmlFor="card_search">
                  Assign Physical Card
                </label>
                <p className="text-label-xs text-on-surface-variant">
                  {availableCards.length} cards available in inventory · sequential order
                </p>
              </div>
              {availableCards[0] && (
                <button
                  type="button"
                  onClick={() => {
                    setValue('card_id', availableCards[0].id, { shouldDirty: true, shouldValidate: true });
                    setCardSearch('');
                  }}
                  className={`text-label-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    selectedCardId === availableCards[0].id
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-primary-container/30 text-primary hover:bg-primary-container/50'
                  }`}
                  title="Assign the top card from your physical stack"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  Next in Stack: {availableCards[0].card_number}
                </button>
              )}
            </div>

            {/* Currently Selected Card Status Bar */}
            {selectedCard ? (
              <div className="bg-surface border border-primary/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-body-md tracking-wider text-on-surface">
                        {selectedCard.card_number}
                      </span>
                      {selectedCard.id === availableCards[0]?.id ? (
                        <span className="text-[10px] bg-primary text-on-primary font-bold px-2 py-0.5 rounded-full">
                          Top of Stack (#1)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-surface-container text-on-surface-variant font-bold px-2 py-0.5 rounded-full">
                          #{availableCards.findIndex(c => c.id === selectedCard.id) + 1} in stack
                        </span>
                      )}
                    </div>
                    <p className="text-label-xs text-primary font-medium">
                      ✓ Ready to link upon saving member
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('card_id', '', { shouldDirty: true, shouldValidate: true })}
                  className="text-label-xs text-on-surface-variant hover:text-error hover:bg-error-container/20 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  title="Remove card assignment"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Remove Card</span>
                </button>
              </div>
            ) : (
              <div className="bg-surface border border-dashed border-outline-variant rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-on-surface-variant text-label-sm">
                  <span className="material-symbols-outlined text-[18px]">credit_card_off</span>
                  <span>No physical card selected (member will use digital pass only)</span>
                </div>
                {availableCards[0] && (
                  <button
                    type="button"
                    onClick={() => setValue('card_id', availableCards[0].id, { shouldDirty: true, shouldValidate: true })}
                    className="text-label-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Assign Top Card
                  </button>
                )}
              </div>
            )}

            {/* Search Input Field */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                id="card_search"
                type="text"
                value={cardSearch}
                onChange={e => handleCardSearchChange(e.target.value)}
                onKeyDown={handleCardSearchKeyDown}
                placeholder="Search card by number or last 4 digits (e.g. 0285)..."
                className="input-field pl-9 pr-8 font-mono text-body-sm"
              />
              {cardSearch && (
                <button
                  type="button"
                  onClick={() => setCardSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Scrollable Card Selection List */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-outline-variant/60 bg-surface divide-y divide-outline-variant/30">
              {/* Option: No physical card */}
              <button
                type="button"
                onClick={() => setValue('card_id', '', { shouldDirty: true, shouldValidate: true })}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-label-sm transition-colors ${
                  !selectedCardId
                    ? 'bg-primary-container/20 text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span>
                  No card — assign later from Cards page
                </span>
                {!selectedCardId && <span className="material-symbols-outlined text-[16px]">check</span>}
              </button>

              {filteredCards.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant text-label-sm">
                  <span className="material-symbols-outlined text-[22px] block mb-1">search_off</span>
                  No cards match &quot;{cardSearch}&quot;
                </div>
              ) : (
                filteredCards.slice(0, 50).map(c => {
                  const idx = availableCards.findIndex(item => item.id === c.id);
                  const isSelected = selectedCardId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setValue('card_id', c.id, { shouldDirty: true, shouldValidate: true });
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-primary-container/30 text-primary font-bold'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-label-xs font-mono text-on-surface-variant w-8 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-body-sm tracking-wide truncate">
                          {c.card_number}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded shrink-0">
                            Top
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Helper footer */}
            <div className="flex items-center justify-between text-label-xs text-on-surface-variant px-1">
              <span>
                {cardSearch
                  ? `Found ${filteredCards.length} matching card${filteredCards.length === 1 ? '' : 's'}`
                  : `Showing ${Math.min(filteredCards.length, 50)} of ${availableCards.length} available cards`}
              </span>
              <span>Sorted in physical sequential order</span>
            </div>

            {/* Hidden field registered with react-hook-form */}
            <input type="hidden" {...register('card_id')} value={selectedCardId || ''} />
          </div>
        )}

        {/* Initial Loyalty Points (optional) */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md space-y-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <p className="text-label-md font-bold text-on-surface">Add Points <span className="text-body-sm font-normal text-on-surface-variant">(optional — welcome bonus)</span></p>
          </div>
          <input
            id="initial_points"
            type="number"
            min={0}
            className="input-field"
            placeholder="e.g. 50 — leave blank for 0 points"
            {...register('initial_points', {
              min: { value: 0, message: 'Points cannot be negative' },
            })}
          />
          {errors.initial_points && <p className="text-error text-label-sm mt-1">{errors.initial_points.message}</p>}
          <p className="text-label-sm text-on-surface-variant">Award an initial points balance when enrolling this member (e.g. as a welcome bonus).</p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <div className="text-body-md text-on-surface-variant">
            <p>A <strong>membership number</strong> and <strong>QR code</strong> will be automatically generated on save.</p>
          </div>
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
          <div className="flex items-center justify-between bg-surface-container p-3 rounded-xl">
            <span className="text-body-sm text-on-surface-variant">Download sample CSV format:</span>
            <button
              onClick={downloadCsvTemplate}
              className="text-primary text-label-md font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Template.csv
            </button>
          </div>

          <div>
            <label className="form-label">Paste CSV Content or Drag CSV Text</label>
            <p className="text-label-xs text-on-surface-variant mb-2">Columns: Name, Phone, DateOfBirth (optional), AnniversaryDate (optional)</p>
            <textarea
              rows={8}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={`Name,Phone,DateOfBirth,AnniversaryDate\nRahul Sharma,9876543210,1990-05-15,2018-11-20\nPriya Patel,9876543211,1995-08-22,`}
              className="w-full p-3 font-mono text-body-sm bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary"
            />
          </div>

          {importResult && (
            <div className={`p-4 rounded-xl text-body-sm border ${importResult.skipped === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              <p className="font-bold">Import Summary:</p>
              <p>✅ Successfully imported: {importResult.imported}</p>
              {importResult.skipped > 0 && <p>⚠️ Skipped (duplicates/errors): {importResult.skipped}</p>}
              {importResult.errors.length > 0 && (
                <ul className="mt-2 text-label-xs list-disc pl-4 space-y-0.5">
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
