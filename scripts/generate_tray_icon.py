from PIL import Image, ImageDraw
from pathlib import Path

SIZE = 32
SCALE = 16
CANVAS = SIZE * SCALE

FUR = (139, 94, 60, 255)
FUR_LIGHT = (196, 156, 116, 255)
MUZZLE = (245, 230, 210, 255)
DARK = (35, 22, 14, 255)
NOSE = (50, 30, 22, 255)
HIGHLIGHT = (255, 255, 255, 255)
OUTLINE = (60, 38, 22, 255)

img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

def px(x):
    return int(x * SCALE)

ear_r = px(4)
for ear_cx in (px(7), px(25)):
    draw.ellipse(
        (ear_cx - ear_r, px(6) - ear_r, ear_cx + ear_r, px(6) + ear_r),
        fill=FUR, outline=OUTLINE, width=max(1, SCALE // 2),
    )
    inner = px(2)
    draw.ellipse(
        (ear_cx - inner, px(6) - inner, ear_cx + inner, px(6) + inner),
        fill=FUR_LIGHT,
    )

head_box = (px(4), px(6), px(28), px(30))
draw.ellipse(head_box, fill=FUR, outline=OUTLINE, width=max(1, SCALE // 2))

muzzle_box = (px(9), px(17), px(23), px(28))
draw.ellipse(muzzle_box, fill=MUZZLE)

eye_r = px(2.2)
eye_y = px(15)
for ex in (px(11.5), px(20.5)):
    draw.ellipse(
        (ex - eye_r, eye_y - eye_r, ex + eye_r, eye_y + eye_r),
        fill=DARK,
    )
    hl = px(0.7)
    draw.ellipse(
        (ex - hl + px(0.6), eye_y - hl - px(0.4), ex + hl + px(0.6), eye_y + hl - px(0.4)),
        fill=HIGHLIGHT,
    )

nose_box = (px(14), px(18.5), px(18), px(21.5))
draw.ellipse(nose_box, fill=NOSE)

mouth_box = (px(13), px(20.5), px(19), px(25))
draw.arc(mouth_box, start=20, end=160, fill=DARK, width=max(2, int(SCALE * 0.9)))
draw.line((px(16), px(21.5), px(16), px(23)), fill=DARK, width=max(2, int(SCALE * 0.7)))

cheek_r = px(1.4)
cheek_color = (220, 150, 130, 140)
for cx in (px(9.5), px(22.5)):
    draw.ellipse(
        (cx - cheek_r, px(20) - cheek_r, cx + cheek_r, px(20) + cheek_r),
        fill=cheek_color,
    )

icon = img.resize((SIZE, SIZE), Image.LANCZOS)

out = Path(__file__).resolve().parent.parent / "public" / "tray-icon.png"
out.parent.mkdir(parents=True, exist_ok=True)
icon.save(out, "PNG")
print(f"Wrote {out} ({icon.size[0]}x{icon.size[1]})")
