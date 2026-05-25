# app/core/seed.py
import logging
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product

logger = logging.getLogger(__name__)


# ── 默认管理员 ───────────────────────────────────────────────
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@12345"
ADMIN_NICKNAME = "开发者"


# ── 20 条种子商品 ────────────────────────────────────────────
# 字段命名严格对齐模块二契约（skin_tones / face_shapes / route_path）
_PRODUCTS = [
    {
        "name": "Velvet Matte Lipstick - Ruby Woo", "brand": "Clinique", "category": "Lips",
        "subcategory": "lipstick", "price": 129,
        "description": "Iconic red lipstick with a velvet matte finish, all-day stay.",
        "ingredients": "Castor Seed Oil, Beeswax, Vitamin E, Carnauba Wax",
        "usage_tips": "Apply directly to lips; touch up after meals.",
        "tags": ["Matte", "Long-lasting"],
        "skin_types": ["normal", "dry"], "skin_tones": ["cool", "warm"], "face_shapes": ["oval", "heart"],
        "route_path": "/products/1",
    },
    {
        "name": "Hydrating Foundation - Ivory", "brand": "Dior", "category": "Face",
        "subcategory": "foundation", "price": 299,
        "description": "24-hour hydrating liquid foundation with full coverage and natural finish.",
        "ingredients": "Hyaluronic Acid, Glycerin, Vitamin E, Niacinamide",
        "usage_tips": "Use a sponge or brush; blend from center outward.",
        "tags": ["Full Coverage", "Hydrating"],
        "skin_types": ["dry", "normal"], "skin_tones": ["light", "cool"], "face_shapes": ["oval", "round"],
        "route_path": "/products/2",
    },
    {
        "name": "Smoky Eye Palette", "brand": "MAC", "category": "Eyes",
        "subcategory": "palette", "price": 189,
        "description": "9-color smoky eye palette covering day-to-night looks with matte and shimmer shades.",
        "ingredients": "Mica, Talc, Magnesium Stearate, Tocopheryl Acetate",
        "usage_tips": "Apply lighter shades on lid, deeper tones in crease.",
        "tags": ["Smoky", "Palette"],
        "skin_types": ["normal"], "skin_tones": ["cool", "warm", "deep"], "face_shapes": ["oval", "long"],
        "route_path": "/products/3",
    },
    {
        "name": "Anti-Aging Night Serum", "brand": "Estée Lauder", "category": "Skincare",
        "subcategory": "serum", "price": 549,
        "description": "Retinol + Vitamin C night serum, visibly reduces fine lines after 4 weeks.",
        "ingredients": "Retinol 0.3%, Vitamin C, Hyaluronic Acid, Peptides",
        "usage_tips": "Use at night only; follow with moisturizer and SPF in the morning.",
        "tags": ["Anti-aging", "Night Use"],
        "skin_types": ["normal", "dry"], "skin_tones": ["light", "medium"], "face_shapes": ["oval", "square"],
        "route_path": "/products/4",
    },
    {
        "name": "Glossy Lip Plumper", "brand": "Fenty Beauty", "category": "Lips",
        "subcategory": "gloss", "price": 159,
        "description": "Plumping gloss with peptide complex; instant fullness, no sting.",
        "ingredients": "Peptide Complex, Hyaluronic Acid, Vitamin E",
        "usage_tips": "Apply alone or over lipstick; reapply every 2-3 hours.",
        "tags": ["Plumping", "Glossy"],
        "skin_types": ["normal"], "skin_tones": ["warm", "deep"], "face_shapes": ["heart", "round"],
        "route_path": "/products/5",
    },
    {
        "name": "Setting Powder - Translucent", "brand": "Laura Mercier", "category": "Face",
        "subcategory": "powder", "price": 269,
        "description": "Iconic loose setting powder for photo-finish, oil control all day.",
        "ingredients": "Silica, Talc, Mica",
        "usage_tips": "Press into T-zone with a powder puff; dust off excess.",
        "tags": ["Setting", "Translucent"],
        "skin_types": ["oily", "combination"], "skin_tones": ["light", "medium"], "face_shapes": ["oval", "round"],
        "route_path": "/products/6",
    },
    {
        "name": "Volumizing Mascara", "brand": "Maybelline", "category": "Eyes",
        "subcategory": "mascara", "price": 89,
        "description": "Lash Sensational mascara with fan-effect brush for instant volume.",
        "ingredients": "Carnauba Wax, Beeswax, Iron Oxides",
        "usage_tips": "Wiggle from root to tip; build 2-3 coats.",
        "tags": ["Volumizing", "Black"],
        "skin_types": ["normal"], "skin_tones": ["cool", "warm", "deep"], "face_shapes": ["oval", "round"],
        "route_path": "/products/7",
    },
    {
        "name": "Hyaluronic Acid Serum", "brand": "The Ordinary", "category": "Skincare",
        "subcategory": "serum", "price": 69,
        "description": "B5 + Hyaluronic Acid serum for deep hydration, plumped skin.",
        "ingredients": "Hyaluronic Acid, Vitamin B5, Aqua",
        "usage_tips": "Apply on damp skin morning and night; seal with moisturizer.",
        "tags": ["Hydrating", "Daily Use"],
        "skin_types": ["dry", "sensitive", "normal"], "skin_tones": ["light", "medium", "deep"], "face_shapes": ["oval", "long"],
        "route_path": "/products/8",
    },
    {
        "name": "Cream Blush - Rose", "brand": "Rare Beauty", "category": "Face",
        "subcategory": "blush", "price": 149,
        "description": "Liquid blush with weightless feel and natural flush color.",
        "ingredients": "Glycerin, Cyclopentasiloxane, Tocopheryl Acetate",
        "usage_tips": "Dot on cheeks and blend quickly with fingers.",
        "tags": ["Cream", "Natural"],
        "skin_types": ["normal", "dry"], "skin_tones": ["cool", "warm"], "face_shapes": ["heart", "oval"],
        "route_path": "/products/9",
    },
    {
        "name": "Eyeliner Pen - Pitch Black", "brand": "NYX", "category": "Eyes",
        "subcategory": "eyeliner", "price": 59,
        "description": "Waterproof felt-tip eyeliner with precise tip for crisp wings.",
        "ingredients": "Carbon Black, Acrylates Copolymer",
        "usage_tips": "Hold tip flat for thicker lines, vertical for fine lines.",
        "tags": ["Waterproof", "Felt-tip"],
        "skin_types": ["normal"], "skin_tones": ["cool", "warm"], "face_shapes": ["oval", "long"],
        "route_path": "/products/10",
    },
    {
        "name": "Gentle Cleanser", "brand": "CeraVe", "category": "Skincare",
        "subcategory": "cleanser", "price": 79,
        "description": "Hydrating cleanser with ceramides for sensitive skin, fragrance-free.",
        "ingredients": "Ceramides 1/3/6-II, Hyaluronic Acid, Niacinamide",
        "usage_tips": "Massage onto damp skin; rinse with lukewarm water.",
        "tags": ["Gentle", "Daily Use"],
        "skin_types": ["sensitive", "dry", "normal"], "skin_tones": ["light", "medium", "deep"], "face_shapes": ["oval", "round"],
        "route_path": "/products/11",
    },
    {
        "name": "Highlighter - Champagne Pop", "brand": "Becca", "category": "Face",
        "subcategory": "highlighter", "price": 199,
        "description": "Champagne shimmer powder highlighter for a lit-from-within glow.",
        "ingredients": "Mica, Synthetic Fluorphlogopite, Silica",
        "usage_tips": "Apply on cheekbones, brow bone, and cupid's bow.",
        "tags": ["Shimmer", "Highlight"],
        "skin_types": ["normal"], "skin_tones": ["light", "warm"], "face_shapes": ["oval", "heart"],
        "route_path": "/products/12",
    },
    {
        "name": "Liquid Lipstick - Nude Beige", "brand": "Kylie Cosmetics", "category": "Lips",
        "subcategory": "lipstick", "price": 99,
        "description": "Long-wearing matte liquid lipstick; transfer-resistant for 8 hours.",
        "ingredients": "Isododecane, Trimethylsiloxysilicate, Pigments",
        "usage_tips": "Apply thin layer; let dry for 60 seconds before touching.",
        "tags": ["Matte", "Nude"],
        "skin_types": ["normal"], "skin_tones": ["warm", "medium"], "face_shapes": ["oval", "square"],
        "route_path": "/products/13",
    },
    {
        "name": "Brow Pencil - Soft Brown", "brand": "Anastasia", "category": "Eyes",
        "subcategory": "brow", "price": 119,
        "description": "Dual-end brow pencil with ultra-fine tip and spoolie.",
        "ingredients": "Hydrogenated Cottonseed Oil, Synthetic Wax",
        "usage_tips": "Draw short hair-like strokes; blend with spoolie.",
        "tags": ["Brow", "Pencil"],
        "skin_types": ["normal"], "skin_tones": ["cool", "warm", "medium"], "face_shapes": ["oval", "round", "heart"],
        "route_path": "/products/14",
    },
    {
        "name": "Sunscreen SPF 50+", "brand": "La Roche-Posay", "category": "Skincare",
        "subcategory": "sunscreen", "price": 159,
        "description": "Anthelios SPF 50+ broad-spectrum sunscreen, lightweight finish.",
        "ingredients": "Avobenzone 3%, Octocrylene 10%, Octisalate 5%",
        "usage_tips": "Apply 15 min before sun exposure; reapply every 2 hours.",
        "tags": ["Sunscreen", "SPF50+"],
        "skin_types": ["sensitive", "oily", "normal"], "skin_tones": ["light", "medium", "deep"], "face_shapes": ["oval", "round"],
        "route_path": "/products/15",
    },
    {
        "name": "Concealer - Fair", "brand": "NARS", "category": "Face",
        "subcategory": "concealer", "price": 219,
        "description": "Radiant creamy concealer with 16-hour wear, full coverage.",
        "ingredients": "Glycerin, Mica, Silica",
        "usage_tips": "Dot under eyes and on blemishes; tap to blend.",
        "tags": ["Concealer", "Creamy"],
        "skin_types": ["normal", "dry"], "skin_tones": ["light"], "face_shapes": ["oval", "round"],
        "route_path": "/products/16",
    },
    {
        "name": "Lip Balm - Vanilla", "brand": "Burt's Bees", "category": "Lips",
        "subcategory": "balm", "price": 39,
        "description": "100% natural beeswax lip balm with vanilla extract, deeply nourishing.",
        "ingredients": "Beeswax, Coconut Oil, Vitamin E, Vanilla Extract",
        "usage_tips": "Apply liberally throughout the day.",
        "tags": ["Balm", "Natural"],
        "skin_types": ["sensitive", "dry", "normal"], "skin_tones": ["light", "medium", "deep"], "face_shapes": ["oval", "round", "heart"],
        "route_path": "/products/17",
    },
    {
        "name": "Eye Shadow Stick - Bronze", "brand": "Bobbi Brown", "category": "Eyes",
        "subcategory": "shadow", "price": 179,
        "description": "Long-wear eye shadow stick, glide-on color, smudge-proof.",
        "ingredients": "Cyclopentasiloxane, Mica, Silica",
        "usage_tips": "Glide directly onto lid; blend with fingertip within 30s.",
        "tags": ["Shadow", "Long-wear"],
        "skin_types": ["normal"], "skin_tones": ["warm", "medium"], "face_shapes": ["oval", "heart"],
        "route_path": "/products/18",
    },
    {
        "name": "Niacinamide Serum 10%", "brand": "The Ordinary", "category": "Skincare",
        "subcategory": "serum", "price": 49,
        "description": "10% Niacinamide + 1% Zinc serum for blemish control and pore refinement.",
        "ingredients": "Niacinamide 10%, Zinc PCA 1%, Aqua",
        "usage_tips": "Apply morning and night; can be layered under moisturizer.",
        "tags": ["Blemish", "Pore"],
        "skin_types": ["oily", "combination", "normal"], "skin_tones": ["light", "medium", "deep"], "face_shapes": ["oval", "round"],
        "route_path": "/products/19",
    },
    {
        "name": "Bronzer - Sun Kissed", "brand": "Benefit", "category": "Face",
        "subcategory": "bronzer", "price": 229,
        "description": "Hoola matte bronzer for a natural sun-kissed effect, fade-resistant.",
        "ingredients": "Talc, Mica, Silica, Iron Oxides",
        "usage_tips": "Sweep on cheekbones, temples, and jawline.",
        "tags": ["Bronzer", "Matte"],
        "skin_types": ["normal"], "skin_tones": ["warm", "medium"], "face_shapes": ["oval", "round", "square"],
        "route_path": "/products/20",
    },
]


async def seed_all():
    """注入 admin + 20 条种子商品（幂等）"""
    async with AsyncSessionLocal() as db:
        # admin
        r = await db.execute(select(User).where(User.username == ADMIN_USERNAME))
        if r.scalar_one_or_none() is None:
            db.add(User(
                username=ADMIN_USERNAME,
                hashed_password=hash_password(ADMIN_PASSWORD),
                nickname=ADMIN_NICKNAME,
            ))
            logger.info(f"已创建默认账号 {ADMIN_USERNAME} / {ADMIN_PASSWORD}")

        # products
        r = await db.execute(select(Product))
        if r.first() is None:
            for p in _PRODUCTS:
                db.add(Product(**p, is_active=True))
            logger.info(f"已注入 {len(_PRODUCTS)} 条种子商品")

        await db.commit()
