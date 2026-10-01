/**
 * Metro Cardz — MSG91 SMS OTP Sender
 * Mirrors the Python backend's send_otp logic exactly.
 * Falls back to console.log in development if API key is not set.
 */

const MSG91_API_KEY     = process.env.MSG91_API_KEY ?? '';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID_OTP ?? '';

export async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  // In development, always log and succeed
  if (process.env.NODE_ENV !== 'production' || !MSG91_API_KEY || !MSG91_TEMPLATE_ID) {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    const res = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': MSG91_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        short_url: '0',
        recipients: [{ mobiles: `91${phone}`, var1: otp }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch (err) {
    console.error('MSG91 SMS failed:', err);
    return false;
  }
}

/** Generate a 6-digit OTP */
export function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}
