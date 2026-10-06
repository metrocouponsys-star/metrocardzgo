import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { MembershipType, OfferTemplate } from '../../types';
import * as api from '../../api';
import { invalidateContaining } from '../../api/cache';

const T = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  orange: '#FF6B35',
  orangeLight: '#FFF4EF',
  orangeDark: '#E85A28',
  shadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
  shadowMd: '0 4px 16px rgba(15,23,42,0.08)',
};

const TIER_PALETTES = [
  { color: '#FF6B35', bg: '#FFF4EF', gradient: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)' },
  { color: '#00D4AA', bg: '#E0FFF6', gradient: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)' },
  { color: '#2563EB', bg: '#EFF6FF', gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
  { color: '#7C3AED', bg: '#F5F3FF', gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' },
  { color: '#F59E0B', bg: '#FEF3C7', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
];

export default function MembershipTypesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [availableOffers, setAvailableOffers] = useState<OfferTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<MembershipType | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const isOwner = user?.role === 'owner' || user?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memberTypes, offers] = await Promise.all([
        api.getMembershipTypes(user?.merchant_id || ''),
        api.getOfferTemplates(user?.merchant_id || ''),
      ]);
      setTypes(memberTypes);
      setAvailableOffers(offers.filter((item: OfferTemplate) => item.active));
    } catch {
      addToast('error', 'Failed to load membership types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.merchant_id]);

  const openCreate = () => {
    setEditTarget(null);
    setDraftName('');
    setDraftDescription('');
    setShowForm(true);
  };

  const openEdit = (type: MembershipType) => {
    setEditTarget(type);
    setDraftName(type.name);
    setDraftDescription(type.description || '');
    setShowForm(true);
  };

  const save = async () => {
    if (!draftName.trim()) {
      addToast('error', 'Type name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: draftName.trim(),
        description: draftDescription.trim(),
      };

      if (editTarget) {
        await api.updateMembershipType(user?.merchant_id || '', editTarget.id, payload as any);
        addToast('success', 'Membership type updated');
      } else {
        await api.createMembershipType(user?.merchant_id || '', payload as any);
        addToast('success', 'Membership type created');
      }

      invalidateContaining('membership-types');
      invalidateContaining('member');
      invalidateContaining('offers');
      setShowForm(false);
      setEditTarget(null);
      fetchData();
    } catch (error: any) {
      addToast('error', error?.message || 'Failed to save membership type');
    } finally {
      setSaving(false);
    }
  };

  const deleteType = async (id: string) => {
    try {
      await api.deleteMembershipType(user?.merchant_id || '', id);
      addToast('success', 'Membership type deleted');
      invalidateContaining('membership-types');
      fetchData();
    } catch (error: any) {
      addToast('error', error?.message || 'Failed to delete membership type');
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em', color: T.text }}>Membership Types</h1>
            <p style={{ margin: '8px 0 0', color: T.textMuted, fontSize: 14 }}>Create member tiers and group offers into each level.</p>
          </div>
          {isOwner && (
            <button
              onClick={openCreate}
              style={{
                background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                padding: '10px 16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(249,115,22,0.18)',
              }}
            >
              + Add Type
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 18, padding: 20, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, color: T.text }}>{editTarget ? 'Edit Membership Type' : 'Add Membership Type'}</h2>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Tier name
                </label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. Gold / Prime / Standard"
                  style={{ width: '100%', height: 46, border: `1px solid ${T.border}`, borderRadius: 12, background: '#F8FAFC', padding: '0 14px', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Description
                </label>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe benefits and privileges for this member tier"
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, background: '#F8FAFC', padding: '12px 14px', fontSize: 14, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.text, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !draftName.trim()}
                style={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  padding: '10px 16px',
                  fontWeight: 800,
                  cursor: saving || !draftName.trim() ? 'not-allowed' : 'pointer',
                  opacity: saving || !draftName.trim() ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : editTarget ? 'Save changes' : 'Create tier'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[1, 2, 3].map((item) => (
              <div key={item} style={{ height: 220, borderRadius: 18, background: '#fff', border: `1px solid ${T.border}` }} />
            ))}
          </div>
        ) : types.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${T.border}`, padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🎟️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 22, color: T.text }}>No membership types yet</h3>
            <p style={{ margin: 0, color: T.textMuted }}>Create your first member tier to start organizing benefits and bundled offers.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
            {types.map((type, index) => {
              const palette = TIER_PALETTES[index % TIER_PALETTES.length];
              const bundledCount = Array.isArray((type as any).bundled_offers) ? (type as any).bundled_offers.length : 0;

              return (
                <div key={type.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: T.shadow }}>
                  <div style={{ background: palette.gradient, padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                      Membership tier
                    </div>
                    <h3 style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 800, color: '#fff' }}>{type.name}</h3>
                  </div>

                  <div style={{ padding: 18 }}>
                    <p style={{ margin: '0 0 14px', color: T.textMuted, lineHeight: 1.6, minHeight: 48 }}>
                      {type.description || 'No description provided for this membership tier yet.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Bundled offers</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: palette.color }}>{bundledCount}</span>
                    </div>

                    {isOwner && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openEdit(type)}
                          style={{ flex: 1, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontWeight: 700, color: T.text }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteType(type.id)}
                          style={{ border: '1px solid #FECACA', background: '#fff', color: '#DC2626', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
