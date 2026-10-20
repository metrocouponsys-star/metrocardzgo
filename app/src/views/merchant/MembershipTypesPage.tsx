import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { MembershipType, OfferTemplate } from '../../types';
import * as api from '../../api';
import { invalidateContaining } from '../../api/cache';
import { ConfirmModal } from '../../components/ui/Modal';

const T = {
  bg: '#F0F4F8',
  card: '#FFFFFF',
  border: '#E4E9F0',
  borderLight: '#EFF3F8',
  text: '#0D1321',
  textMuted: '#5C6B80',
  textLight: '#9AAAB8',
  orange: '#FF6B35',
  orangeLight: '#FFF2EC',
  orangeDark: '#C14D1E',
  shadow: '0 1px 3px rgba(13,19,33,0.06), 0 4px 16px rgba(13,19,33,0.04)',
  shadowHover: '0 6px 28px rgba(13,19,33,0.12), 0 2px 6px rgba(13,19,33,0.06)',
  shadowGlow: '0 8px 32px rgba(255,107,53,0.22)',
};

const TIER_PALETTES = [
  { color: '#FF6B35', bg: '#FFF2EC', gradient: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)', glow: 'rgba(255,107,53,0.22)' },
  { color: '#00B894', bg: '#E0FFF6', gradient: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)', glow: 'rgba(0,212,170,0.22)' },
  { color: '#2563EB', bg: '#EFF6FF', gradient: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)', glow: 'rgba(37,99,235,0.22)' },
  { color: '#7C3AED', bg: '#F5F3FF', gradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', glow: 'rgba(124,58,237,0.22)' },
  { color: '#D97706', bg: '#FEF3C7', gradient: 'linear-gradient(135deg, #FCD34D 0%, #D97706 100%)', glow: 'rgba(217,119,6,0.22)' },
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
  const [deleteTierTarget, setDeleteTierTarget] = useState<MembershipType | null>(null);
  const [deletingTier, setDeletingTier] = useState(false);
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

  const handleDeleteTier = async () => {
    if (!deleteTierTarget) return;
    setDeletingTier(true);
    try {
      await api.deleteMembershipType(user?.merchant_id || '', deleteTierTarget.id);
      addToast('success', `Membership tier "${deleteTierTarget.name}" deleted`);
      invalidateContaining('membership-types');
      setDeleteTierTarget(null);
      fetchData();
    } catch (error: any) {
      addToast('error', error?.message || 'Failed to delete membership type');
    } finally {
      setDeletingTier(false);
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.orangeLight, border: `1px solid ${T.border}`, borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.orangeDark, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              Member Tiers
            </div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: T.text, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Membership Types</h1>
            <p style={{ margin: '8px 0 0', color: T.textMuted, fontSize: 14 }}>Create member tiers and attach bundled offers to each level.</p>
          </div>
          {isOwner && (
            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
                border: 'none', borderRadius: 14, color: '#fff',
                padding: '12px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: T.shadowGlow, transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
              Add Tier
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, marginBottom: 28, boxShadow: T.shadowHover }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.orange, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>
                {editTarget ? 'Edit Membership Tier' : 'Create New Tier'}
              </h2>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 11, color: T.textMuted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tier Name *</label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. Gold, Premium, Silver, Standard"
                  autoFocus
                  style={{ width: '100%', height: 48, border: `1.5px solid ${T.border}`, borderRadius: 12, background: '#F8FAFC', padding: '0 16px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = T.orange)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 11, color: T.textMuted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Description</label>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe benefits and privileges for this member tier"
                  style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12, background: '#F8FAFC', padding: '12px 16px', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = T.orange)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowForm(false)}
                style={{ border: `1px solid ${T.border}`, background: T.card, color: T.textMuted, borderRadius: 12, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.18s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F0F4F8')}
                onMouseLeave={e => (e.currentTarget.style.background = T.card)}
              >Cancel</button>
              <button onClick={save} disabled={saving || !draftName.trim()}
                style={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
                  border: 'none', borderRadius: 12, color: '#fff',
                  padding: '10px 20px', fontWeight: 800, fontSize: 14,
                  cursor: saving || !draftName.trim() ? 'not-allowed' : 'pointer',
                  opacity: saving || !draftName.trim() ? 0.55 : 1,
                  boxShadow: saving || !draftName.trim() ? 'none' : T.shadowGlow,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }}>progress_activity</span>}
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Tier'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 240, borderRadius: 20, background: 'linear-gradient(90deg,#F3F4F6,#E5E7EB,#F3F4F6)', backgroundSize: '200%', animation: 'shimmer 1.4s linear infinite', border: `1px solid ${T.border}` }} />
            ))}
          </div>
        ) : types.length === 0 ? (
          <div style={{ background: T.card, borderRadius: 24, border: `1px solid ${T.border}`, padding: '60px 24px', textAlign: 'center', boxShadow: T.shadow }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎟️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.03em' }}>No membership types yet</h3>
            <p style={{ margin: '0 0 24px', color: T.textMuted, fontSize: 14 }}>Create your first member tier to start organizing benefits and bundled offers.</p>
            {isOwner && (
              <button onClick={openCreate} style={{ background: 'linear-gradient(135deg,#FF6B35,#E85A28)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, cursor: 'pointer', boxShadow: T.shadowGlow, fontSize: 14 }}>
                + Create First Tier
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {types.map((type, index) => {
              const palette = TIER_PALETTES[index % TIER_PALETTES.length];
              const bundledCount = Array.isArray((type as any).bundled_offers) ? (type as any).bundled_offers.length : 0;
              const memberCount = (type as any).member_count ?? 0;

              return (
                <div key={type.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: T.shadow, display: 'flex', flexDirection: 'column', transition: 'all 0.22s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = T.shadowHover; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = T.shadow; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  {/* Gradient Header */}
                  <div style={{ background: palette.gradient, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative glow */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>Membership Tier</div>
                          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{type.name}</h3>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 12, padding: '6px 12px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{memberCount}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: 0, color: T.textMuted, lineHeight: 1.65, fontSize: 13, minHeight: 40 }}>
                      {type.description || 'No description provided for this tier.'}
                    </p>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, background: T.borderLight, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: palette.color }}>{bundledCount}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bundled Offers</div>
                      </div>
                      <div style={{ flex: 1, background: T.borderLight, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{memberCount}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Members</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button onClick={() => openEdit(type)}
                          style={{ flex: 1, border: `1px solid ${T.border}`, background: '#F8FAFC', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.18s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = T.textMuted; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                        </button>
                        <button onClick={() => setDeleteTierTarget(type)}
                          style={{ border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#FFF5F5')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
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

      <ConfirmModal
        isOpen={!!deleteTierTarget}
        onClose={() => !deletingTier && setDeleteTierTarget(null)}
        onConfirm={handleDeleteTier}
        title="Delete Membership Tier"
        isLoading={deletingTier}
        danger={true}
        confirmLabel={deletingTier ? 'Deleting...' : 'Yes, Delete Tier'}
        description={
          `Deleting the "${deleteTierTarget?.name}" tier will affect all members currently on this plan. ` +
          `Please reassign members to another tier before deleting, or they will be moved to the default tier automatically.`
        }
      />

      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
