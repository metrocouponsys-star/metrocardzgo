import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { Campaign, ReminderRule, MembershipType } from '../../types';
import * as api from '../../api';
import { format } from 'date-fns';


const TRIGGER_LABELS: Record<string, string> = {
  birthday: '🎂 Birthday Reminder', anniversary: '💍 Anniversary Reminder',
  expiry: '⏰ Expiry Reminder', loyalty_threshold: '⭐ Loyalty Threshold',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-[#F3F4F6] text-[#6B7280]',
  scheduled: 'bg-amber-100 text-amber-600',
  sending: 'bg-[#F5EDD0]/10 text-[#B8941F]',
  sent: 'bg-[#F3F4F6] text-[#6B7280]',
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
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    trigger_type: 'birthday' as ReminderRule['trigger_type'],
    channel: 'whatsapp' as ReminderRule['channel'],
    template_text: '',
    days_before: 0,
    send_time: '09:00',
    threshold_value: '',
  });
  // Feature 2: expanded timing state per rule
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [timingForm, setTimingForm] = useState<Record<string, { send_time: string; days_before: number }>>({});

  // Lucky Draw states
  const [luckyDraws, setLuckyDraws] = useState<any[]>([]);
  const [showNewDraw, setShowNewDraw] = useState(false);
  const [drawForm, setDrawForm] = useState({ name: '', prize: '', min_points: '0', min_visits: '0', draw_date: '' });

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
      api.getLuckyDraws().catch(() => []),
    ]).then(([c, r, mt, draws]) => {
      setCampaigns(c);
      setReminders(r);
      setMembershipTypes(mt);
      setLuckyDraws(draws);
      setLoading(false);
    });
  }, []);

  const toggleReminder = async (rule: ReminderRule) => {
    const updated = await api.updateReminderRule(user?.merchant_id || '', rule.id, { active: !rule.active });
    setReminders(rs => rs.map(r => r.id === rule.id ? updated : r));
    addToast('success', `${TRIGGER_LABELS[rule.trigger_type]} ${updated.active ? 'enabled' : 'disabled'}`);
  };

  const birthdayRule = reminders.find(r => r.trigger_type === 'birthday');
  const anniversaryRule = reminders.find(r => r.trigger_type === 'anniversary');

  const handleQuickToggleBirthday = async () => {
    if (birthdayRule) {
      await toggleReminder(birthdayRule);
    } else {
      try {
        const newRule = await api.createReminderRule(user?.merchant_id || '', {
          trigger_type: 'birthday',
          channel: 'whatsapp',
          template_text: 'Happy Birthday! 🎉 Visit us today to claim your special birthday gift/discount!',
          days_before: 0,
          send_time: '09:00',
          active: true,
          timezone: 'Asia/Kolkata',
        });
        setReminders(rs => [...rs, newRule]);
        addToast('success', 'Birthday reminder created & enabled!');
      } catch {
        addToast('error', 'Failed to enable Birthday reminder');
      }
    }
  };

  const handleQuickToggleAnniversary = async () => {
    if (anniversaryRule) {
      await toggleReminder(anniversaryRule);
    } else {
      try {
        const newRule = await api.createReminderRule(user?.merchant_id || '', {
          trigger_type: 'anniversary',
          channel: 'whatsapp',
          template_text: 'Happy Anniversary! 💍 Celebrate your special milestone with a special treat from us!',
          days_before: 0,
          send_time: '09:00',
          active: true,
          timezone: 'Asia/Kolkata',
        });
        setReminders(rs => [...rs, newRule]);
        addToast('success', 'Anniversary reminder created & enabled!');
      } catch {
        addToast('error', 'Failed to enable Anniversary reminder');
      }
    }
  };

  const createReminder = async () => {
    setSubmitting(true);
    try {
      const newRule = await api.createReminderRule(user?.merchant_id || '', {
        trigger_type: reminderForm.trigger_type,
        channel: reminderForm.channel,
        template_text: reminderForm.template_text,
        days_before: reminderForm.days_before,
        send_time: reminderForm.send_time || '09:00',
        threshold_value: reminderForm.threshold_value ? Number(reminderForm.threshold_value) : undefined,
        active: true,
        timezone: 'Asia/Kolkata',
      });
      setReminders(rs => [...rs, newRule]);
      setShowNewReminder(false);
      setReminderForm({ trigger_type: 'birthday', channel: 'whatsapp', template_text: '', days_before: 0, send_time: '09:00', threshold_value: '' });
      addToast('success', `${TRIGGER_LABELS[reminderForm.trigger_type]} created!`);
    } catch {
      addToast('error', 'Failed to create reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (rule: ReminderRule) => {
    if (!window.confirm(`Delete "${TRIGGER_LABELS[rule.trigger_type]}" reminder?`)) return;
    try {
      await api.deleteReminderRule(user?.merchant_id || '', rule.id);
      setReminders(rs => rs.filter(r => r.id !== rule.id));
      addToast('success', 'Reminder deleted');
    } catch {
      addToast('error', 'Failed to delete reminder');
    }
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

  const createDraw = async () => {
    try {
      const newDraw = await api.createLuckyDraw({
        name: drawForm.name,
        prize: drawForm.prize,
        min_points: Number(drawForm.min_points),
        min_visits: Number(drawForm.min_visits),
        draw_date: drawForm.draw_date,
      });
      setLuckyDraws(prev => [newDraw, ...prev]);
      setShowNewDraw(false);
      setDrawForm({ name: '', prize: '', min_points: '0', min_visits: '0', draw_date: '' });
      addToast('success', 'Lucky draw created!');
    } catch {
      addToast('error', 'Failed to create lucky draw');
    }
  };

  const handleRunDraw = async (drawId: string) => {
    try {
      const res = await api.runLuckyDraw(drawId);
      addToast('success', `🎉 Winner Selected: ${res.winner_name} won "${res.prize}"!`);
      api.getLuckyDraws().then(setLuckyDraws).catch(() => {});
    } catch (e: any) {
      addToast('error', e.message || 'Failed to select winner');
    }
  };

  const handleDeleteDraw = async (drawId: string) => {
    if (!window.confirm('Delete this lucky draw?')) return;
    try {
      await api.deleteLuckyDraw(drawId);
      setLuckyDraws(prev => prev.filter(d => d.id !== drawId));
      addToast('success', 'Lucky draw deleted');
    } catch {
      addToast('error', 'Failed to delete draw');
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
        send_now: form.schedule === 'now',
      } as any);
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
    <div className="px-4 md:px-10 py-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Campaigns & Messaging</h2>
        <p className="page-subtitle">Automate birthday reminders and send one-off campaigns to your members.</p>
      </div>

      {/* Automated Reminders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Automated Reminders</h3>
          <button onClick={() => setShowNewReminder(true)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Reminder
          </button>
        </div>

        {/* Quick Auto-Reminders Toggle Card */}
        <div className="bg-[#FBF7EA] border border-[#B8941F]/30 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#B8941F] text-[22px]">notifications_active</span>
            <h4 className="text-base font-bold text-[#111111]">Quick Reminder Toggles</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Birthday Toggle */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg">
                  🎂
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Birthday Reminder</p>
                  <p className="text-xs text-[#6B7280]">
                    {birthdayRule ? (birthdayRule.active ? 'Active · Sends on DOB' : 'Disabled') : 'Tap toggle to enable'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickToggleBirthday}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  birthdayRule?.active ? 'bg-[#B8941F]' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${birthdayRule?.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Anniversary Toggle */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                  💍
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Anniversary Reminder</p>
                  <p className="text-xs text-[#6B7280]">
                    {anniversaryRule ? (anniversaryRule.active ? 'Active · Sends on Anniversary' : 'Disabled') : 'Tap toggle to enable'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickToggleAnniversary}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  anniversaryRule?.active ? 'bg-[#B8941F]' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${anniversaryRule?.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
        <div className="card divide-y divide-outline-variant/30">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-[#F3F4F6] rounded" />
                  <div className="h-3 w-32 bg-[#F3F4F6] rounded" />
                </div>
                <div className="w-12 h-6 bg-[#F3F4F6] rounded-full" />
              </div>
            ))
          ) : reminders.map(rule => (
            <div key={rule.id} className="p-4 border-b border-[#E5E7EB]/20 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-bold">{TRIGGER_LABELS[rule.trigger_type]}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.channel === 'whatsapp' ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-[#B8941F]-fixed/30 text-[#B8941F]'}`}>
                      {rule.channel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] line-clamp-1">{rule.template_text}</p>
                  {/* Feature 2: show current timing */}
                  <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    Sends at {rule.send_time ? rule.send_time.slice(0, 5) : '09:00'}
                    {rule.days_before != null && rule.days_before > 0 ? ` · ${rule.days_before} days before` : ' · on the day'}
                    <button
                      onClick={() => toggleTimingExpand(rule)}
                      className="ml-1 text-[#B8941F] text-xs underline-offset-2 hover:underline"
                    >
                      {expandedRuleId === rule.id ? 'Cancel' : 'Edit timing'}
                    </button>
                  </p>
                </div>
                {/* Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => deleteReminder(rule)}
                    className="flex items-center justify-center w-7 h-7 rounded-full border border-red-200 text-red-600 hover:bg-red-600/10"
                    title="Delete reminder"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                  <button
                    onClick={() => toggleReminder(rule)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
                      ${rule.active ? 'bg-[#6B7280]' : 'bg-[#F3F4F6]-high'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${rule.active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              {/* Feature 2: expandable timing controls */}
              {expandedRuleId === rule.id && (
                <div className="mt-3 pt-3 border-t border-[#E5E7EB]/20 bg-[#F3F4F6]/40 rounded-xl p-3 space-y-3">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Timing Configuration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Send at (time of day)</label>
                      <input
                        type="time"
                        className="input-field"
                        value={timingForm[rule.id]?.send_time || '09:00'}
                        onChange={e => setTimingForm(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], send_time: e.target.value } }))}
                      />
                      <p className="text-xs text-[#6B7280] mt-1">IST · Applied hourly by the worker</p>
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
                      <p className="text-xs text-[#6B7280] mt-1">
                        {(timingForm[rule.id]?.days_before || 0) === 0 ? 'Sends on the day of the event' : `Sends ${timingForm[rule.id]?.days_before} day(s) before`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setExpandedRuleId(null)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                    <button onClick={() => saveTiming(rule)} className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Save Timing
                    </button>
                  </div>
                  <p className="text-xs text-[#6B7280]">
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
        <div className="flex items-center justify-between mb-4">
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
                <div className="h-5 w-48 bg-[#F3F4F6] rounded" />
                <div className="h-4 w-64 bg-[#F3F4F6] rounded" />
                <div className="h-3 w-32 bg-[#F3F4F6] rounded" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card p-8 text-center text-[#6B7280]">
            <span className="material-symbols-outlined text-[48px] mb-2">campaign</span>
            <p>No campaigns yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-bold">{c.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.channel === 'whatsapp' ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-[#B8941F]-fixed/30 text-[#B8941F]'}`}>
                      {c.channel}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] line-clamp-1 mb-2">{c.template_text}</p>
                  <div className="flex gap-4 text-xs text-[#6B7280]">
                    <span>{c.audience_size} recipients</span>
                    {c.sent_count !== undefined && c.sent_count > 0 && <span>✓ {c.sent_count} sent</span>}
                    {c.scheduled_at && <span>📅 {format(new Date(c.scheduled_at), 'dd MMM yyyy, HH:mm')}</span>}
                    <span>{format(new Date(c.created_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
                {c.status === 'scheduled' && (
                  <button
                    onClick={async () => {
                      try {
                        const updated = await api.sendCampaign(user?.merchant_id || '', c.id);
                        setCampaigns(list => list.map(x => x.id === c.id ? updated : x));
                        addToast('success', `Campaign "${c.name}" sent now!`);
                      } catch {
                        addToast('error', 'Failed to send campaign');
                      }
                    }}
                    className="btn-outline py-1 px-3 text-xs shrink-0 whitespace-nowrap"
                  >
                    Send Now
                  </button>
                )}
              </div>
            ))}

          </div>
        )}
      </section>

      {/* Lucky Draws Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">🎰 Lucky Draws</h3>
          <button onClick={() => setShowNewDraw(true)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Lucky Draw
          </button>
        </div>

        {luckyDraws.length === 0 ? (
          <div className="card p-8 text-center text-[#6B7280]">
            <span className="material-symbols-outlined text-[48px] mb-2 font-variation-fill">casino</span>
            <p>No lucky draws scheduled. Create one to reward your members!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {luckyDraws.map(draw => (
              <div key={draw.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-bold">{draw.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${draw.status === 'drawn' ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-amber-100 text-amber-600'}`}>
                      {draw.status === 'drawn' ? 'Completed' : 'Open'}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] font-medium">Prize: {draw.prize}</p>
                  <div className="flex gap-4 text-xs text-[#6B7280] mt-1.5 flex-wrap">
                    <span>👥 {draw.entry_count} entries</span>
                    <span>⭐ Min {Number(draw.min_points).toFixed(0)} pts</span>
                    <span>📍 Min {draw.min_visits} visits</span>
                    <span>📅 Draw Date: {draw.draw_date}</span>
                  </div>
                  {draw.status === 'drawn' && draw.winner_member_id && (
                    <div className="mt-2 p-2 bg-green-50 text-green-800 rounded-lg text-xs font-semibold border border-green-200 inline-block">
                      🎉 Winner selected!
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {draw.status === 'open' && (
                    <button onClick={() => handleRunDraw(draw.id)}
                      className="btn-primary py-1 px-3 text-xs shrink-0 font-bold whitespace-nowrap" style={{ minHeight: 'auto' }}>
                      Pick Winner
                    </button>
                  )}
                  <button onClick={() => handleDeleteDraw(draw.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-red-200 text-red-600 hover:bg-red-600/10">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Reminder Modal */}
      <Modal isOpen={showNewReminder} onClose={() => setShowNewReminder(false)} title="New Automatic Reminder" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Trigger Event *</label>
              <select className="input-field" value={reminderForm.trigger_type} onChange={e => setReminderForm(f => ({ ...f, trigger_type: e.target.value as any }))}>
                <option value="birthday">🎂 Birthday</option>
                <option value="anniversary">💍 Anniversary</option>
                <option value="expiry">⏰ Card Expiry</option>
                <option value="loyalty_threshold">⭐ Loyalty Points</option>
              </select>
            </div>
            <div>
              <label className="form-label">Channel *</label>
              <select className="input-field" value={reminderForm.channel} onChange={e => setReminderForm(f => ({ ...f, channel: e.target.value as any }))}>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
          {reminderForm.trigger_type === 'loyalty_threshold' && (
            <div>
              <label className="form-label">Points Threshold</label>
              <input type="number" className="input-field" placeholder="e.g. 500" value={reminderForm.threshold_value} onChange={e => setReminderForm(f => ({ ...f, threshold_value: e.target.value }))} />
              <p className="text-xs text-[#6B7280] mt-1">Reminder fires when member reaches this many points.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Send Time (IST)</label>
              <input type="time" className="input-field" value={reminderForm.send_time} onChange={e => setReminderForm(f => ({ ...f, send_time: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">
                {reminderForm.trigger_type === 'expiry' ? 'Days before expiry' : reminderForm.trigger_type === 'birthday' ? 'Days before birthday' : 'Days before event'}
              </label>
              <input type="number" className="input-field" min={0} max={60} value={reminderForm.days_before} onChange={e => setReminderForm(f => ({ ...f, days_before: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-[#6B7280] mt-1">{reminderForm.days_before === 0 ? 'Sends on the day' : `Sends ${reminderForm.days_before} day(s) before`}</p>
            </div>
          </div>
          <div>
            <label className="form-label">Message Template *</label>
            <textarea
              rows={3}
              className="input-field h-auto py-3 resize-none"
              placeholder="e.g. Happy Birthday {name}! 🎂 Visit us for a special treat."
              value={reminderForm.template_text}
              onChange={e => setReminderForm(f => ({ ...f, template_text: e.target.value }))}
            />
            <p className="text-xs text-[#6B7280] mt-1">Placeholders: &#123;name&#125;, &#123;business_name&#125;, &#123;points&#125;</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewReminder(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={createReminder}
              disabled={submitting || !reminderForm.template_text}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Create Reminder
            </button>
          </div>
        </div>
      </Modal>

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
            <p className="text-xs text-[#6B7280] mt-1">Placeholders: &#123;name&#125;, &#123;offer&#125;, &#123;business_name&#125;</p>
          </div>
          <div>
            <label className="form-label">Schedule</label>
            <div className="flex gap-3">
              {[{ v: 'now', l: 'Send Now' }, { v: 'schedule', l: 'Schedule' }].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, schedule: opt.v }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all
                    ${form.schedule === opt.v ? 'bg-[#B8941F] text-white border-[#B8941F]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]'}`}
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

      {/* New Lucky Draw Modal */}
      <Modal isOpen={showNewDraw} onClose={() => setShowNewDraw(false)} title="New Lucky Draw" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="form-label">Draw Name *</label>
            <input className="input-field" placeholder="e.g. Monthly Mega Giveaway" value={drawForm.name} onChange={e => setDrawForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Prize *</label>
            <input className="input-field" placeholder="e.g. ₹5,000 Gift Voucher" value={drawForm.prize} onChange={e => setDrawForm(f => ({ ...f, prize: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Min Points Requirement</label>
              <input type="number" className="input-field" value={drawForm.min_points} onChange={e => setDrawForm(f => ({ ...f, min_points: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Min Visits Requirement</label>
              <input type="number" className="input-field" value={drawForm.min_visits} onChange={e => setDrawForm(f => ({ ...f, min_visits: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Draw Date *</label>
            <input type="date" className="input-field" value={drawForm.draw_date} onChange={e => setDrawForm(f => ({ ...f, draw_date: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewDraw(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createDraw} disabled={!drawForm.name || !drawForm.prize || !drawForm.draw_date} className="btn-primary flex-1">
              Schedule Draw
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


