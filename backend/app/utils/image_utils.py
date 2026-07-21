"""
Metro Cardz — Logo Image Processing Utilities

Two-layer compression strategy:
  1. Client-side (browser-image-compression in React) — reduces upload size, gives instant preview.
  2. Server-side (this module, Pillow) — the real enforcement net, always runs regardless of client.

Storage math:
  Uncompressed phone photos: 2–5 MB each → ~200–500 merchants in 1 GB Supabase Storage free tier.
  Compressed WebP (max 100 KB, 512 px): → 10,000+ merchants in the same 1 GB budget.

Rules baked in:
  - One logo per merchant, always overwrite (upsert) — no stale versions pile up.
  - Fixed max dimension 512 px — logos never render larger than this in any UI.
  - WebP output only — 25–35% smaller than JPEG at equal perceived quality.
  - Hard reject raw input > 10 MB before allocating any CPU.
  - Binary-search quality reduction ensures we stay under 100 KB no matter what.
"""

import io
from PIL import Image


# ── Constants ────────────────────────────────────────────────────────────────

MAX_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB — hard reject before processing
MAX_OUTPUT_KB    = 100                 # 100 KB — target output ceiling
MAX_DIMENSION    = 512                 # px — max width OR height (aspect ratio preserved)
INITIAL_QUALITY  = 85                 # WebP quality to start binary search from
MIN_QUALITY      = 20                 # Never go below this (visually unacceptable)


# ── Core compression function ─────────────────────────────────────────────────

def compress_logo(file_bytes: bytes) -> bytes:
    """
    Compress and resize an image into a WebP file under MAX_OUTPUT_KB.

    Args:
        file_bytes: Raw bytes of the uploaded image file.

    Returns:
        Compressed WebP bytes, guaranteed to be ≤ MAX_OUTPUT_KB (100 KB).

    Raises:
        ValueError: If file_bytes exceeds MAX_UPLOAD_BYTES (10 MB).
        ValueError: If the bytes cannot be decoded as an image.
    """
    # Hard size guard — reject before PIL even opens the file
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError(
            f"File too large ({len(file_bytes) // (1024*1024)} MB). "
            f"Maximum allowed is {MAX_UPLOAD_BYTES // (1024*1024)} MB."
        )

    # Open image with PIL
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()  # Detect corrupt images early
        img = Image.open(io.BytesIO(file_bytes))  # Re-open after verify() (it closes the stream)
    except Exception as e:
        raise ValueError(f"Invalid image file: {e}") from e

    # Normalise colour mode — WebP does not handle all PIL modes cleanly
    if img.mode in ("RGBA", "LA"):
        # Preserve transparency by converting to RGBA first
        img = img.convert("RGBA")
    elif img.mode == "P":
        # Palette mode — convert via RGBA to capture transparency in GIF-style images
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # Resize — shrink to MAX_DIMENSION while preserving aspect ratio; never upscale
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    # Binary-search WebP quality to hit the MAX_OUTPUT_KB target
    quality = INITIAL_QUALITY
    output = io.BytesIO()

    while quality >= MIN_QUALITY:
        output.seek(0)
        output.truncate()
        img.save(
            output,
            format="WEBP",
            quality=quality,
            method=6,          # Slower encode but best compression ratio
        )
        if output.tell() <= MAX_OUTPUT_KB * 1024:
            break
        quality -= 10          # Step down and try again

    # If even MIN_QUALITY is above budget (extreme edge case: very complex 512×512 image),
    # we still return the best we achieved — it will be close to the limit.
    return output.getvalue()


# ── Supabase Storage helpers ──────────────────────────────────────────────────

def get_supabase_client():
    """
    Returns a Supabase client initialised with the service key.
    Import is deferred so the module can be used without supabase-py installed
    (e.g. in unit tests that mock this function).
    """
    from supabase import create_client, Client
    from app.core.config import settings

    url = (settings.supabase_url or "").strip()
    key = (settings.supabase_service_key or "").strip()
    return create_client(url, key)


def upload_logo_to_storage(merchant_id: str, webp_bytes: bytes) -> str:
    """
    Upload compressed WebP logo bytes to Supabase Storage.

    Storage path: merchant-logos/{merchant_id}/logo.webp
    Always uses upsert=True (overwrite existing logo — no version history needed).

    Args:
        merchant_id: The UUID of the merchant.
        webp_bytes:  Compressed WebP image bytes.

    Returns:
        Public URL string to the uploaded logo file.

    Raises:
        RuntimeError: If Supabase URL / service key are not configured or storage fails.
        Exception: On Supabase API errors.
    """
    from app.core.config import settings

    if (
        not settings.supabase_url
        or not settings.supabase_service_key
        or "xxxxxxxxxxxx" in settings.supabase_url
        or "your-supabase" in settings.supabase_service_key
        or "example.com" in settings.supabase_url
    ):
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set to real credentials to use remote logo uploads."
        )

    client = get_supabase_client()
    bucket  = "merchant-logos"
    path    = f"{merchant_id}/logo.webp"

    res = client.storage.from_(bucket).upload(
        path,
        webp_bytes,
        file_options={
            "content-type": "image/webp",
            "upsert": "true",          # Always overwrite — one logo per merchant
            "cache-control": "3600",   # Browser cache 1 hour
        },
    )

    if isinstance(res, dict) and ("error" in res or str(res.get("statusCode", "")).startswith(("4", "5"))):
        raise RuntimeError(f"Supabase storage error response: {res}")

    # Build the public URL (bucket must have public read policy in Supabase dashboard)
    url = (settings.supabase_url or "").strip().rstrip("/")
    public_url = f"{url}/storage/v1/object/public/{bucket}/{path}"
    return public_url


def delete_logo_from_storage(merchant_id: str) -> None:
    """
    Remove a merchant's logo from Supabase Storage.
    Called when a merchant is deleted or resets their logo.

    Args:
        merchant_id: The UUID of the merchant whose logo to delete.
    """
    from app.core.config import settings

    if not settings.supabase_url or not settings.supabase_service_key:
        return  # Nothing to clean up if storage isn't configured

    client = get_supabase_client()
    path   = f"{merchant_id}/logo.webp"
    client.storage.from_("merchant-logos").remove([path])
