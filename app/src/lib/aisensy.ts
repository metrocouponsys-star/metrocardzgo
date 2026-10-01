/**
 * Metro Cardz — AiSensy WhatsApp Sender
 * Used for campaign messages and birthday/anniversary reminders via WhatsApp.
 */

const AISENSY_API_KEY       = process.env.AISENSY_API_KEY ?? '';
const AISENSY_CAMPAIGN_NAME = process.env.AISENSY_CAMPAIGN_NAME ?? 'metrocardz_reminder';

export async function sendWhatsApp(
  phone: string,
  message: string,
  campaignName?: string
): Promise<boolean> {
  if (!AISENSY_API_KEY) {
    console.log(`[DEV] WhatsApp to ${phone}: ${message}`);
    return true;
  }

  try {
    const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: campaignName ?? AISENSY_CAMPAIGN_NAME,
        destination: phone.replace(/\D/g, ''),
        userName: 'Metro Cardz',
        source: 'new-landing-page form',
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        paramsFallbackValue: { FirstName: 'Member', message },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch (err) {
    console.error('AiSensy WhatsApp failed:', err);
    return false;
  }
}
