import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { Campaign, ReminderRule, MembershipType } from '../../types';
import * as api from '../../api/client';
import { format } from 'date-fns';

const TRIGGER_LABELS: Record<string, string> = {
  birthday: '🎂 Birthday Reminder', anniversary: '💍 Anniversary Reminder',
  expiry: '⏰ Expiry Reminder', loyalty_threshold: '⭐ Loyalty Threshold',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-surface-container text-on-surface-variant',
  scheduled: 'bg-amber-100 text-amber-600',
  sending: 'bg-primary-container/10 text-primary',
  sent: 'bg-secondary-container text-secondary',
};

export default function CampaignsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reminders, setReminders] = useState<ReminderRule[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderRule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Feature 2: expanded timing state per rule
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [timingForm, setTimingForm] = useState<Record<string, { send_time: string; days_before: number }>>({});

  const [form, setForm] = useState({
    name: '', target_audience: 'all' as Campaign['target_audience'],
    target_membership_type_id: '', channel: 'whatsapp' as Campaign['channel'],
    template_text: '', schedule: 'now', scheduled_at: '',
  });

  useEffect(() => {
    Promise.all([
      api.getCampaigns(user?.merchant_id || ''),
      api.getReminderRules(user?.merchant_id || ''),
      api.getMembershipTypes(user?.merchant_id || ''),
    ]).then(([c, r, mt]) => {
      setCampaigns(c);
      setReminders(r);
      setMembershipTypes(mt);
      setLoading(false);
    });
  }, []);

  const toggleReminder = async (rule: ReminderRule) => {
    const updated = await api.updateReminderRule(user?.merchant_id || '', rule.id, { active: !rule.active });
    setReminders(rs => rs.map(r => r.id === rule.id ? updated : r));
    addToast('success', `${TRIGGER_LABELS[rule.trigger_type]} ${updated.active ? 'enabled' : 'disabled'}`);
  };

  // Feature 2: save reminder timing
  const saveTiming = async (rule: ReminderRule) => {
    const tf = timingForm[rule.id] || { send_time: rule.send_time || '09:00', days_before: rule.days_before || 0 };
    try {
      const updated = await api.updateReminderRule(user?.merchant_id || '', rule.id, {
        send_time: tf.send_time ? (tf.send_time.length === 5 ? tf.send_time + ':00' : tf.send_time) : undefined,
        days_before: tf.days_before,
      });
      setReminders(rs => rs.map(r => r.id === rule.id ? updated : r));
      setExpandedRuleId(null);
      addToast('success', 'Reminder timing saved');
    } catch {
      addToast('error', 'Failed to save timing');
    }
  };

  const toggleTimingExpand = (rule: ReminderRule) => {
    if (expandedRuleId === rule.id) {
      setExpandedRuleId(null);
    } else {
      setExpandedRuleId(rule.id);
      // Init form from current rule values
      setTimingForm(prev => ({
        ...prev,
        [rule.id]: {
          send_time: rule.send_time ? rule.send_time.slice(0, 5) : '09:00',
          days_before: rule.days_before ?? 0,
        },
      }));
    }
  };

  const createCampaign = async () => {
    setSubmitting(true);
    try {
      const newCampaign = await api.createCampaign(user?.merchant_id || '', {
        name: form.name,
        target_audience: form.target_audience,
        target_membership_type_id: form.target_membership_type_id || undefined,
        channel: form.channel,
        template_text: form.template_text,
        scheduled_at: form.schedule === 'schedule' ? form.scheduled_at : undefined,
      });
      setCampaigns(c => [newCampaign, ...c]);
      setShowNewCampaign(false);
      setForm({ name: '', target_audience: 'all', target_membership_type_id: '', channel: 'whatsapp', template_text: '', schedule: 'now', scheduled_at: '' });
      addToast('success', form.schedule === 'now' ? `Campaign "${form.name}" sent!` : `Campaign scheduled!`);
    } catch {
      addToast('error', 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-4xl mx-auto space-y-xl animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Campaigns & Messaging</h2>
        <p className="page-subtitle">Automate birthday reminders and send one-off campaigns to your members.</p>
      </div>

      {/* Automated Reminders */}
      <section>
        <h3 className="section-title mb-md">Automated Reminders</h3>
        <div className="card divide-y divide-outline-variant/30">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-surface-container rounded" />
                  <div className="h-3 w-32 bg-surface-container rounded" />
                </div>
                <div className="w-12 h-6 bg-surface-container rounded-full" />
              </div>
            ))
          ) : reminders.map(rule => (
            <div key={rule.id} className="p-4 border-b border-outline-variant/20 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-body-lg font-bold">{TRIGGER_LABELS[rule.trigger_type]}</h4>
                    <span className={`text-label-sm px-2 py-0.5 rounded-full ${rule.channel === 'whatsapp' ? 'bg-secondary-container text-secondary' : 'bg-primary-fixed/30 text-primary'}`}>
                      {rule.channel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-1">{rule.template_text}</p>
                  {/* Feature 2: show current timing */}
                  <p className="text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    Sends at {rule.send_time ? rule.send_time.slice(0, 5) : '09:00'}
                    {rule.days_before != null && rule.days_before > 0 ? ` · ${rule.days_before} days before` : ' · on the day'}
                    <button
                      onClick={() => toggleTimingExpand(rule)}
                      className="ml-1 text-primary text-label-sm underline-offset-2 hover:underline"
                    >
                      {expandedRuleId === rule.id ? 'Cancel' : 'Edit timing'}
                    </button>
                  </p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggleReminder(rule)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
                    ${rule.active ? 'bg-secondary' : 'bg-surface-container-high'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${rule.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {/* Feature 2: expandable timing controls */}
              {expandedRuleId === rule.id && (
                <div className="mt-3 pt-3 border-t border-outline-variant/20 bg-surface-container/40 rounded-xl p-3 space-y-3">
                  <p className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Timing Configuration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Send at (time of day)</label>
                      <input
                        type="time"
                        className="input-field"
                        value={timingForm[rule.id]?.send_time || '09:00'}
                        onChange={e => setTimingForm(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], send_time: e.target.value } }))}
                      />
                      <p className="text-label-sm text-on-surface-variant mt-1">IST · Applied hourly by the worker</p>
                    </div>
                    <div>
                      <label className="form-label">
                        {rule.trigger_type === 'expiry' ? 'Days before expiry' : rule.trigger_type === 'birthday' ? 'Days before birthday' : rule.trigger_type === 'anniversary' ? 'Days before anniversary' : 'Days before event'}
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        min={0}
                        max={30}
                        value={timingForm[rule.id]?.days_before ?? 0}
                        onChange={e => setTimingForm(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], days_before: parseInt(e.target.value) || 0 } }))}
                      />
                      <p className="text-label-sm text-on-surface-variant mt-1">
                        {(timingForm[rule.id]?.days_before || 0) === 0 ? 'Sends on the day of the event' : `Sends ${timingForm[rule.id]?.days_before} day(s) before`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setExpandedRuleId(null)} className="btn-secondary text-label-md px-4 py-2">Cancel</button>
                    <button onClick={() => saveTiming(rule)} className="btn-primary text-label-md px-4 py-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Save Timing
                    </button>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    ⚠️ Changes apply from the next hourly scan — already-queued messages for today are not affected.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* One-Time Campaigns */}
      <section>
        <div className="flex items-center justify-between mb-md">
          <h3 className="section-title">One-Time Campaigns</h3>
          <button onClick={() => setShowNewCampaign(true)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Campaign
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse space-y-2">
                <div className="h-5 w-48 bg-surface-container rounded" />
                <div className="h-4 w-64 bg-surface-container rounded" />
                <div className="h-3 w-32 bg-surface-container rounded" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card p-8 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-2">campaign</span>
            <p>No campaigns yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="card p-md flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-body-lg font-bold">{c.name}</h4>
                    <span className={`text-label-sm px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    <span className={`text-label-sm px-2 py-0.5 rounded-full ${c.channel === 'whatsapp' ? 'bg-secondary-container text-secondary' : 'bg-primary-fixed/30 text-primary'}`}>
                      {c.channel}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-1 mb-2">{c.template_text}</p>
                  <div className="flex gap-4 text-label-sm text-on-surface-variant">
                    <span>{c.audience_size} recipients</span>
                    {c.sent_count !== undefined && c.sent_count > 0 && <span>✓ {c.sent_count} sent</span>}
                    {c.scheduled_at && <span>📅 {format(new Date(c.scheduled_at), 'dd MMM yyyy')}</span>}
                    <span>{format(new Date(c.created_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Campaign Modal */}
      <Modal isOpen={showNewCampaign} onClose={() => setShowNewCampaign(false)} title="New Campaign" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="form-label">Campaign Name *</label>
            <input className="input-field" placeholder="e.g. Diwali Special Offer" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Target Audience</label>
              <select className="input-field" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value as any }))}>
                <option value="all">All Members</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="by_membership_type">By Membership Type</option>
              </select>
            </div>
            <div>
              <label className="form-label">Channel</label>
              <select className="input-field" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as any }))}>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
          {form.target_audience === 'by_membership_type' && (
            <div>
              <label className="form-label">Membership Type</label>
              <select className="input-field" value={form.target_membership_type_id} onChange={e => setForm(f => ({ ...f, target_membership_type_id: e.target.value }))}>
                <option value="">Select...</option>
                {membershipTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="form-label">Message Template</label>
            <textarea
              rows={3}
              className="input-field h-auto py-3 resize-none"
              placeholder="Use {name}, {offer}, {business_name} as placeholders"
              value={form.template_text}
              onChange={e => setForm(f => ({ ...f, template_text: e.target.value }))}
            />
            <p className="text-label-sm text-on-surface-variant mt-1">Placeholders: &#123;name&#125;, &#123;offer&#125;, &#123;business_name&#125;</p>
          </div>
          <div>
            <label className="form-label">Schedule</label>
            <div className="flex gap-3">
              {[{ v: 'now', l: 'Send Now' }, { v: 'schedule', l: 'Schedule' }].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, schedule: opt.v }))}
                  className={`flex-1 py-2 rounded-lg text-label-md font-label-md border transition-all
                    ${form.schedule === opt.v ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            {form.schedule === 'schedule' && (
              <input type="datetime-local" className="input-field mt-2" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewCampaign(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={createCampaign}
              disabled={submitting || !form.name || !form.template_text}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              {form.schedule === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
