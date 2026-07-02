from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    "/var/folders/7v/tpyzbkzd7p589q373xkj33_40000gn/T/"
    "codex-clipboard-df33460a-4a5a-43f2-af54-1ce15dd3e67d.png"
)
OUT_DIR = ROOT / "public" / "og"

UHD_PATH = OUT_DIR / "pleasefindmethis-social-card.png"
UHD_COPY_PATH = OUT_DIR / "pleasefindmethis-vintage-tee-poster-4k.png"
PREVIEW_PATH = OUT_DIR / "pleasefindmethis-vintage-tee-poster-1200x630.png"


def resize_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    source_ratio = image.width / image.height
    target_ratio = size[0] / size[1]
    if source_ratio > target_ratio:
        height = size[1]
        width = round(height * source_ratio)
    else:
        width = size[0]
        height = round(width / source_ratio)

    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    left = (width - size[0]) // 2
    top = (height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def make_poster(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size

    background = resize_cover(source, size).filter(ImageFilter.GaussianBlur(round(width * 0.025)))
    background = ImageEnhance.Brightness(background).enhance(1.18)
    veil = Image.new("RGB", size, "#f7f4ee")
    canvas = Image.blend(background.convert("RGB"), veil, 0.72)

    max_w = round(width * 0.91)
    max_h = round(height * 0.94)
    scale = min(max_w / source.width, max_h / source.height)
    poster_size = (round(source.width * scale), round(source.height * scale))
    poster = source.resize(poster_size, Image.Resampling.LANCZOS)
    poster = poster.filter(ImageFilter.UnsharpMask(radius=1.25, percent=115, threshold=3))

    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow_box = Image.new("RGBA", poster_size, (0, 0, 0, 82))
    shadow_x = (width - poster_size[0]) // 2 + round(width * 0.012)
    shadow_y = (height - poster_size[1]) // 2 + round(height * 0.018)
    shadow.alpha_composite(shadow_box, (shadow_x, shadow_y))
    shadow = shadow.filter(ImageFilter.GaussianBlur(round(width * 0.01)))

    result = Image.alpha_composite(canvas.convert("RGBA"), shadow)
    poster_x = (width - poster_size[0]) // 2
    poster_y = (height - poster_size[1]) // 2
    result.alpha_composite(poster.convert("RGBA"), (poster_x, poster_y))
    return result.convert("RGB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    original = Image.open(SOURCE).convert("RGB")
    # Crop inside the rounded screenshot corners and remove the stray dark edge artifact.
    cropped = original.crop((24, 18, original.width - 24, original.height - 18))
    cropped = ImageOps.autocontrast(cropped, cutoff=0.15)
    cropped = ImageEnhance.Contrast(cropped).enhance(1.035)
    cropped = ImageEnhance.Sharpness(cropped).enhance(1.08)

    uhd = make_poster(cropped, (3840, 2160))
    preview = make_poster(cropped, (1200, 630))

    uhd.save(UHD_PATH, "PNG", optimize=True, compress_level=9)
    uhd.save(UHD_COPY_PATH, "PNG", optimize=True, compress_level=9)
    preview.save(PREVIEW_PATH, "PNG", optimize=True, compress_level=9)

    print(UHD_PATH)
    print(UHD_COPY_PATH)
    print(PREVIEW_PATH)


if __name__ == "__main__":
    main()
