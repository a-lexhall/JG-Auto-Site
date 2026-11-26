"""Shrink car photos uploaded through Pages CMS.

Phone photos are often 3-6 MB, which makes the cars page slow on mobile data.
This resizes anything in Assets/images/cars wider or taller than MAX_SIDE,
turns it the right way up, strips location data, and re-saves it under the
same name, so the links in cars.json keep working.

Run by .github/workflows/shrink-car-photos.yml. Safe to run again: photos that
are already small enough are left alone.
"""

import sys
from pathlib import Path

from PIL import Image, ImageOps

FOLDER = Path("Assets/images/cars")
MAX_SIDE = 1600
JPEG_QUALITY = 82
SKIP_UNDER_BYTES = 450_000


def shrink(path: Path) -> bool:
    if path.stat().st_size < SKIP_UNDER_BYTES:
        with Image.open(path) as im:
            if max(im.size) <= MAX_SIDE:
                return False

    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        suffix = path.suffix.lower()
        if suffix in (".jpg", ".jpeg"):
            im.convert("RGB").save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        elif suffix == ".png":
            im.save(path, "PNG", optimize=True)
        elif suffix == ".webp":
            im.save(path, "WEBP", quality=JPEG_QUALITY, method=6)
        else:
            return False
    return True


def main() -> int:
    if not FOLDER.is_dir():
        return 0
    changed = 0
    for path in sorted(FOLDER.iterdir()):
        if path.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        before = path.stat().st_size
        try:
            if shrink(path):
                changed += 1
                print(f"Shrunk {path.name}: {before // 1024} KB -> {path.stat().st_size // 1024} KB")
        except Exception as exc:  # one bad file shouldn't stop the rest
            print(f"Skipped {path.name}: {exc}", file=sys.stderr)
    print(f"{changed} photo(s) shrunk")
    return 0


if __name__ == "__main__":
    sys.exit(main())
