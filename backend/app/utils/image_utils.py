"""
Metro Cardz — Logo Image Processing Utilities
100% Local Storage — files saved to VPS disk, served by Nginx.

No Supabase. No S3. No third-party storage.

Storage layout on VPS:
  /var/www/metrocardz/uploads/merchant-logos/{merchant_id}/logo.webp
  
Served publicly via Nginx at:
  https://api.metrocardz.in/uploads/merchant-logos/{merchant_id}/logo.webp

Two-layer compression strategy:
  1. Client-side (browser-image-compression in React) — reduces upload size.
  2. Server-side (this module, Pillow) — enforces hard limits always.

Rules:
  - One logo per merchant, always overwrite (upsert) — no stale versions.
  - Fixed max dimension 512 px — logos never render larger than this.
  - WebP output only — 25–35% smaller than JPEG at equal quality.
  - Hard reject raw input > 10 MB before allocating CPU.
  - Binary-search quality reduction ensures output ≤ 100 KB.

Storage cost: ~100 KB × 10,000 merchants = 1 GB total — fits trivially
on Hostinger VPS (200 GB disk). Even 100,000 merchants = 10 GB.
"""

import io
import os
import shutil
from pathlib import Path
from PIL import Image


# ── Constants ────────────────────────────────────────────────────────────────

MAX_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB — hard reject before processing
MAX_OUTPUT_KB    = 100                 # 100 KB — target output ceiling
MAX_DIMENSION    = 512                 # px — max width OR height (aspect preserved)
INITIAL_QUALITY  = 85                 # WebP quality to start binary search
MIN_QUALITY      = 20                 # Never go below this

# Local uploads root — configurable via UPLOADS_DIR env var.
# On VPS: /var/www/metrocardz/uploads
# In development: relative to backend directory
_DEFAULT_UPLOADS_DIR = os.environ.get(
    "UPLOADS_DIR",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"),
)
UPLOADS_ROOT = Path(_DEFAULT_UPLOADS_DIR).resolve()


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
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError(
            f"File too large ({len(file_bytes) // (1024*1024)} MB). "
            f"Maximum allowed is {MAX_UPLOAD_BYTES // (1024*1024)} MB."
        )

    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
        img = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Invalid image file: {e}") from e

    # Normalise colour mode
    if img.mode in ("RGBA", "LA"):
        img = img.convert("RGBA")
    elif img.mode == "P":
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # Resize — shrink only, never upscale
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    # Binary-search WebP quality to hit the MAX_OUTPUT_KB target
    quality = INITIAL_QUALITY
    output = io.BytesIO()

    while quality >= MIN_QUALITY:
        output.seek(0)
        output.truncate()
        img.save(output, format="WEBP", quality=quality, method=6)
        if output.tell() <= MAX_OUTPUT_KB * 1024:
            break
        quality -= 10

    return output.getvalue()


# ── Local Disk Storage helpers ────────────────────────────────────────────────

def _logo_path(merchant_id: str) -> Path:
    """Return the absolute path where the merchant's logo is stored."""
    return UPLOADS_ROOT / "merchant-logos" / merchant_id / "logo.webp"


def _public_url(merchant_id: str) -> str:
    """
    Return the public URL that Nginx will serve the file from.

    Nginx config serves /var/www/metrocardz/uploads at:
      https://api.metrocardz.in/uploads/...
    """
    from app.core.config import settings
    # In production: https://api.metrocardz.in/uploads/merchant-logos/{id}/logo.webp
    # In development: http://localhost:8000/uploads/merchant-logos/{id}/logo.webp
    if settings.is_production:
        base = "https://api.metrocardz.in"
    else:
        base = "http://localhost:8000"
    return f"{base}/uploads/merchant-logos/{merchant_id}/logo.webp"


def upload_logo_to_storage(merchant_id: str, webp_bytes: bytes) -> str:
    """
    Save compressed WebP logo to the local VPS disk.

    Storage path: /var/www/metrocardz/uploads/merchant-logos/{merchant_id}/logo.webp
    Creates directories if they don't exist.
    Always overwrites (upsert) — no version history needed.

    Args:
        merchant_id: The UUID of the merchant.
        webp_bytes:  Compressed WebP image bytes.

    Returns:
        Public URL string to the uploaded logo file.

    Raises:
        RuntimeError: If the file cannot be written to disk.
    """
    logo_path = _logo_path(merchant_id)
    try:
        logo_path.parent.mkdir(parents=True, exist_ok=True)
        logo_path.write_bytes(webp_bytes)
    except OSError as e:
        raise RuntimeError(
            f"Failed to save logo to disk at {logo_path}: {e}\n"
            "Check that the uploads directory exists and the app has write permission."
        ) from e

    return _public_url(merchant_id)


def delete_logo_from_storage(merchant_id: str) -> None:
    """
    Remove a merchant's logo from local disk.
    Called when a merchant is deleted or resets their logo.

    Args:
        merchant_id: The UUID of the merchant whose logo to delete.
    """
    logo_dir = UPLOADS_ROOT / "merchant-logos" / merchant_id
    if logo_dir.exists():
        shutil.rmtree(logo_dir, ignore_errors=True)
