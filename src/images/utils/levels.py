import io
import ipaddress
import os
import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps
from urllib.parse import urlparse

def is_safe_url(url):
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        return False
    
    try:
        ip = ipaddress.ip_address(parsed.hostname)
        if ip.is_private or ip.is_loopback:
            return False
    except ValueError:
        if parsed.hostname in ('localhost', '127.0.0.1'):
            return False
    return True

def generate_rank_card_blocking(
    user_name: str, 
    level: int, 
    current_xp: int, 
    max_xp: int, 
    avatar_url: str, 
    background_path: str,
    status: str = "online", 
    accent_color: str = "#7289da"
) -> bytes:
    card_w, card_h = 600, 200
    
    if not is_safe_url(avatar_url):
        avatar_url = "https://github.com/identicons/neko.png" 

    if not background_path.startswith(("http://", "https://")):
        safe_base = "./static/"
        filename = os.path.basename(background_path)
        background_path = os.path.join(safe_base, filename)
    elif not is_safe_url(background_path):
        background_path = "static/sea.jpg"

    try:
        if background_path.startswith(("http://", "https://")):
            bg_resp = requests.get(background_path, timeout=5)
            bg_img = Image.open(io.BytesIO(bg_resp.content)).convert("RGBA")
        else:
            bg_img = Image.open(background_path).convert("RGBA")
        img = ImageOps.fit(bg_img, (card_w, card_h), centering=(0.5, 0.5))
    except Exception:
        img = Image.new('RGBA', (card_w, card_h), color="#23272a")

    margin_x, margin_y = 30, 25 
    content_rect = [margin_x, margin_y, card_w - margin_x, card_h - margin_y]
    
    overlay = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    overlay_draw.rounded_rectangle(content_rect, radius=20, fill=(0, 0, 0, 160))
    
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    try:
        response = requests.get(avatar_url, timeout=5)
        avatar_raw = Image.open(io.BytesIO(response.content)).convert("RGBA")
    except:
        avatar_raw = Image.new("RGBA", (100, 100), (100, 100, 100))

    avatar_size = (100, 100)
    avatar_raw = avatar_raw.resize(avatar_size, Image.Resampling.LANCZOS)
    mask = Image.new("L", avatar_size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0) + avatar_size, fill=255)
    avatar = ImageOps.fit(avatar_raw, avatar_size, centering=(0.5, 0.5))
    avatar.putalpha(mask)
    
    avatar_pos = (margin_x + 20, (card_h - avatar_size[1]) // 2)
    img.paste(avatar, avatar_pos, avatar)

    status_colors = {"online": "#43b581", "idle": "#faa61a", "dnd": "#f04747", "offline": "#747f8d"}
    status_color = status_colors.get(status, "#747f8d")
    s_size = 26
    s_x, s_y = avatar_pos[0] + avatar_size[0] - s_size + 2, avatar_pos[1] + avatar_size[1] - s_size + 2
    draw.ellipse((s_x-3, s_y-3, s_x+s_size+3, s_y+s_size+3), fill="#1e1e1e")
    draw.ellipse((s_x, s_y, s_x+s_size, s_y+s_size), fill=status_color)

    try:
        font_name = ImageFont.truetype("/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf", 34)
        font_sub = ImageFont.truetype("/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf", 18)
    except:
        font_name = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    text_x = avatar_pos[0] + avatar_size[0] + 30
    
    draw.text((text_x, 50), user_name, fill="white", font=font_name)
    draw.text((text_x, 90), f"Level {level}", fill=accent_color, font=font_sub)
    
    xp_text = f"{current_xp} / {max_xp} XP"
    draw.text((425, 122), xp_text, fill="white", font=font_sub)

    bar_x = text_x
    bar_y = 145 
    bar_w = 360
    bar_h = 12
    if max_xp <= 0:
        progress = 0.0
    else:
        progress = min(max(current_xp / max_xp, 0.0), 1.0)
    
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], radius=6, fill="#484b4e")

    if progress > 0:
        draw.rounded_rectangle([bar_x, bar_y, bar_x + (bar_w * progress), bar_y + bar_h], radius=6, fill=accent_color)

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()