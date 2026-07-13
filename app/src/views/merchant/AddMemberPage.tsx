import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useForm } from 'react-hook-form';
import type { MembershipType, CardInventoryItem } from '../../types';
import * as api from '../../api/client';

interface FormData {
  name: string;
  phone: string;
  date_of_birth: string;
  anniversary_date: string;
  membership_type_id: string;
  card_id: string;
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

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-body-md transition-colors mb-6">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>

      <div className="page-header">
        <h2 className="page-title">Add New Member</h2>
        <p className="page-subtitle">Enroll a new customer and generate their membership card.</p>
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
          <label className="form-label" htmlFor="dob">Date of Birth <span className="text-on-surface-variant font-normal">(for birthday reminders)</span></label>
          <input
            id="dob"
            type="date"
            className="input-field"
            {...register('date_of_birth')}
          />
        </div>

        {/* Anniversary */}
        <div>
          <label className="form-label" htmlFor="anniversary">Anniversary Date <span className="text-on-surface-variant font-normal">(optional — for anniversary reminders)</span></label>
          <input
            id="anniversary"
            type="date"
            className="input-field"
            {...register('anniversary_date')}
          />
        </div>

        {/* Physical Card Assignment (optional) */}
        {availableCards.length > 0 && (
          <div>
            <label className="form-label" htmlFor="card_id">
              Assign Physical Card <span className="text-on-surface-variant font-normal">(optional — assign a pre-printed card now)</span>
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
            <p className="text-label-sm text-on-surface-variant mt-1">{availableCards.length} cards available in your inventory</p>
          </div>
        )}

        {/* Info */}
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
    </div>
  );
}
