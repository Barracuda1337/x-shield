"""
Generate 16x16, 48x48, 128x128 PNG icons for X-Shield Chrome Extension.
Theme: Cyber Security Shield protecting against malicious links and malware on X (Twitter).
Colors: Deep Slate / Cyber Dark background with Glowing Cyan Shield and Neon Red alert spark.
"""
from PIL import Image, ImageDraw
import os

def create_shield_icon(size, output_path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 128.0

    # 1. Background rounded rectangle
    bg_pad = int(4 * s)
    corner_radius = int(24 * s)
    draw.rounded_rectangle(
        [bg_pad, bg_pad, size - bg_pad, size - bg_pad],
        radius=corner_radius,
        fill=(9, 9, 11, 255),  # Deep obsidian matching SEO Lens
        outline=(24, 24, 27, 255),
        width=max(1, int(2 * s))
    )

    # 2. Outer Shield polygon
    shield_pts = [
        (int(64 * s), int(22 * s)),
        (int(32 * s), int(34 * s)),
        (int(32 * s), int(70 * s)),
        (int(64 * s), int(106 * s)),
        (int(96 * s), int(70 * s)),
        (int(96 * s), int(34 * s))
    ]

    # Draw outer emerald shield
    draw.polygon(shield_pts, fill=(18, 18, 21, 255), outline=(16, 185, 129, 255), width=max(1, int(3 * s)))

    # Inner shield accent
    inner_pts = [
        (int(64 * s), int(30 * s)),
        (int(40 * s), int(40 * s)),
        (int(40 * s), int(67 * s)),
        (int(64 * s), int(96 * s)),
        (int(88 * s), int(67 * s)),
        (int(88 * s), int(40 * s))
    ]
    draw.polygon(inner_pts, fill=(6, 78, 59, 140), outline=(52, 211, 153, 255), width=max(1, int(2 * s)))

    # Center: Warning / Lightning / Cyber Cross symbol (Neon Red / Coral)
    # Representing blocked phishing threat
    if size >= 48:
        # Cross / Spark in center
        cx = int(64 * s)
        cy = int(63 * s)
        arm = int(14 * s)
        w = max(2, int(4 * s))
        # Draw slash
        draw.line([(cx - arm, cy - arm), (cx + arm, cy + arm)], fill=(244, 63, 94, 255), width=w)
        draw.line([(cx - arm, cy + arm), (cx + arm, cy - arm)], fill=(244, 63, 94, 255), width=w)
        
        # Center glow dot
        r = max(1, int(3 * s))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))
    else:
        # For 16x16, simple high contrast center dot
        cx = int(64 * s)
        cy = int(63 * s)
        r = max(2, int(6 * s))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(244, 63, 94, 255))

    img.save(output_path, "PNG")
    print(f"Generated {size}x{size} icon -> {output_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ext_dir = os.path.dirname(script_dir)
    icons_dir = os.path.join(ext_dir, "icons")
    os.makedirs(icons_dir, exist_ok=True)

    for sz in [16, 48, 128]:
        create_shield_icon(sz, os.path.join(icons_dir, f"icon-{sz}.png"))
