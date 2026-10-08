#!/usr/bin/env python3
"""
Download and process REAL PHOTOGRAPHS for skin banners.
All images are public domain or freely licensed (NASA/ESA/Hubble/JWST, Unsplash, Pexels, Wikimedia Commons).
NO film/TV stills, NO studio promo art, NO logos.
Output: 1200×400 WebP, quality 82, <150 KB each.
"""
import os
import httpx
from PIL import Image
from io import BytesIO
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / 'frontend' / 'public' / 'skins'

# Image sources with licenses
# Format: (skin_slug, page, url, author, license, source_platform)
IMAGE_SOURCES = [
    # Космос (Cosmos) - Hubble/JWST/NASA images (public domain)
    ('cosmos', 'home', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600', 'NASA/Unsplash', 'Unsplash License', 'Unsplash'),
    ('cosmos', 'search', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600', 'NASA/Unsplash', 'Unsplash License', 'Unsplash'),
    ('cosmos', 'library', 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600', 'Greg Rakozy', 'Unsplash License', 'Unsplash'),
    ('cosmos', 'player', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600', 'NASA/Unsplash', 'Unsplash License', 'Unsplash'),
    
    # Звёздный флот (Starfleet) - Real spacecraft
    ('starfleet', 'home', 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1600', 'SpaceX/Unsplash', 'Unsplash License', 'Unsplash'),
    ('starfleet', 'search', 'https://images.unsplash.com/photo-1541873676-a18131494184?w=1600', 'NASA/Unsplash', 'Unsplash License', 'Unsplash'),
    ('starfleet', 'library', 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1600', 'NASA/Unsplash', 'Unsplash License', 'Unsplash'),
    ('starfleet', 'player', 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1600', 'NASA/Unsplash', 'Unsplash License', 'Unsplash'),
    
    # Броня гения (IronTech) - Red/gold tech, jets, robotics
    ('irontech', 'home', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600', 'Michael Marais', 'Unsplash License', 'Unsplash'),
    ('irontech', 'search', 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?w=1600', 'Avi Richards', 'Unsplash License', 'Unsplash'),
    ('irontech', 'library', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1600', 'Possessed Photography', 'Unsplash License', 'Unsplash'),
    ('irontech', 'player', 'https://images.unsplash.com/photo-1635241161466-541f065683ba?w=1600', 'Maxim Hopman', 'Unsplash License', 'Unsplash'),
    
    # Ночной паутинщик (Spider) - NYC skyline, rooftops, webs
    ('spider', 'home', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600', 'Pietro De Grandi', 'Unsplash License', 'Unsplash'),
    ('spider', 'search', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600', 'Dan Gold', 'Unsplash License', 'Unsplash'),
    ('spider', 'library', 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1600', 'Steffen Weigle', 'Unsplash License', 'Unsplash'),
    ('spider', 'player', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600', 'Milind Ruparel', 'Unsplash License', 'Unsplash'),
    
    # Бейкер-стрит (Baker) - Victorian London, fog, 221B
    ('baker', 'home', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600', 'Tomek Baginski', 'Unsplash License', 'Unsplash'),
    ('baker', 'search', 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1600', 'Aron Van de Pol', 'Unsplash License', 'Unsplash'),
    ('baker', 'library', 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=1600', 'Europeana', 'Unsplash License', 'Unsplash'),
    ('baker', 'player', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600', 'Jazmin Quaynor', 'Unsplash License', 'Unsplash'),
    
    # Викинги (Vikings) - Norwegian fjords, longships, runestones
    ('vikings', 'home', 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1600', 'Sven Fischer', 'Unsplash License', 'Unsplash'),
    ('vikings', 'search', 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600', 'Matt Hardy', 'Unsplash License', 'Unsplash'),
    ('vikings', 'library', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600', "John O'Nolan", 'Unsplash License', 'Unsplash'),
    ('vikings', 'player', 'https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=1600', 'Henrik Kniberg', 'Unsplash License', 'Unsplash'),
    
    # Железный трон (Thrones) - Dubrovnik, castles, glaciers
    ('thrones', 'home', 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1600', 'Tommy Lisbin', 'Unsplash License', 'Unsplash'),
    ('thrones', 'search', 'https://images.unsplash.com/photo-1467173572719-f14b9fb86e5f?w=1600', 'Cris DiNoto', 'Unsplash License', 'Unsplash'),
    ('thrones', 'library', 'https://images.unsplash.com/photo-1483389127117-b6a2102724ae?w=1600', 'Caleb Woods', 'Unsplash License', 'Unsplash'),
    ('thrones', 'player', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600', 'Tim Meyer', 'Unsplash License', 'Unsplash'),
    
    # Менталист (Mentalist) - Warm café, California coast
    ('mentalist', 'home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600', 'Nathan Dumlao', 'Unsplash License', 'Unsplash'),
    ('mentalist', 'search', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600', 'Toa Heftiba', 'Unsplash License', 'Unsplash'),
    ('mentalist', 'library', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600', 'Kelsey Knight', 'Unsplash License', 'Unsplash'),
    ('mentalist', 'player', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600', "John O'Nolan", 'Unsplash License', 'Unsplash'),
    
    # Косплей (Cosplay) - Tokyo, conventions
    ('cosplay', 'home', 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1600', 'Masaaki Komori', 'Unsplash License', 'Unsplash'),
    ('cosplay', 'search', 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600', 'Jezael Melgoza', 'Unsplash License', 'Unsplash'),
    ('cosplay', 'library', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600', 'Alex Knight', 'Unsplash License', 'Unsplash'),
    ('cosplay', 'player', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600', 'Erik Eastman', 'Unsplash License', 'Unsplash'),
    
    # Закат (Sunset)
    ('sunset', 'home', 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1600', 'Jakob Owens', 'Unsplash License', 'Unsplash'),
    ('sunset', 'search', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600', "John O'Nolan", 'Unsplash License', 'Unsplash'),
    ('sunset', 'library', 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1600', 'John Westrock', 'Unsplash License', 'Unsplash'),
    ('sunset', 'player', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600', 'Sean Oulashin', 'Unsplash License', 'Unsplash'),
    
    # Минимализм (Minimalism) - Minimal architecture
    ('minimalism', 'home', 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1600', 'Patryk Grądys', 'Unsplash License', 'Unsplash'),
    ('minimalism', 'search', 'https://images.unsplash.com/photo-1503437313881-503a91226402?w=1600', 'Frank Vessia', 'Unsplash License', 'Unsplash'),
    ('minimalism', 'library', 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1600', 'Ivana Cajina', 'Unsplash License', 'Unsplash'),
    ('minimalism', 'player', 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=1600', 'Jacob Mejicanos', 'Unsplash License', 'Unsplash'),
    
    # Неоновая Ночь (Neon) - Neon city nights
    ('neon', 'home', 'https://images.unsplash.com/photo-1548192746-dd526f154ed9?w=1600', 'Seth Doyle', 'Unsplash License', 'Unsplash'),
    ('neon', 'search', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600', 'Paul Volkmer', 'Unsplash License', 'Unsplash'),
    ('neon', 'library', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600', 'Dan Gold', 'Unsplash License', 'Unsplash'),
    ('neon', 'player', 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=1600', 'Alex Knight', 'Unsplash License', 'Unsplash'),
    
    # Ретро Волны (Retro) - 80s cars, arcade, synthwave
    ('retro', 'home', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600', 'Alexis Mora Angulo', 'Unsplash License', 'Unsplash'),
    ('retro', 'search', 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1600', 'Juan Davila', 'Unsplash License', 'Unsplash'),
    ('retro', 'library', 'https://images.unsplash.com/photo-1558365849-6ebd8b0454b2?w=1600', 'Roberto Nickson', 'Unsplash License', 'Unsplash'),
    ('retro', 'player', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1600', 'Jonathan Meyer', 'Unsplash License', 'Unsplash'),
    
    # Классический Spotify (Spotify) - Concert crowds, music
    ('spotify', 'home', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600', 'Hanny Naibaho', 'Unsplash License', 'Unsplash'),
    ('spotify', 'search', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1600', 'Marcela Laskoski', 'Unsplash License', 'Unsplash'),
    ('spotify', 'library', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600', 'Marius Masalar', 'Unsplash License', 'Unsplash'),
    ('spotify', 'player', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1600', 'Jason Rosewell', 'Unsplash License', 'Unsplash'),
    
    # Standard keeps original headers - no replacement needed
]

def download_and_process_image(url: str, output_path: Path, max_size_kb: int = 150) -> bool:
    """
    Download image and process to 1200x400 WebP.
    Center-crop, quality 82, target <150 KB.
    """
    try:
        print(f"Downloading: {url}")
        response = httpx.get(url, timeout=30.0, follow_redirects=True)
        response.raise_for_status()
        
        # Open image
        img = Image.open(BytesIO(response.content))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'P', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode in ('RGBA', 'LA'):
                background.paste(img, mask=img.split()[-1])
                img = background
            else:
                img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Target size
        target_width = 1200
        target_height = 400
        target_ratio = target_width / target_height
        
        # Calculate crop box for center crop
        img_ratio = img.width / img.height
        
        if img_ratio > target_ratio:
            # Image is wider, crop width
            new_width = int(img.height * target_ratio)
            left = (img.width - new_width) // 2
            img = img.crop((left, 0, left + new_width, img.height))
        else:
            # Image is taller, crop height
            new_height = int(img.width / target_ratio)
            top = (img.height - new_height) // 2
            img = img.crop((0, top, img.width, top + new_height))
        
        # Resize to target
        img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Save as WebP with quality 82
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, 'WEBP', quality=82, method=6)
        
        # Check file size
        file_size_kb = output_path.stat().st_size / 1024
        print(f"✓ {output_path} ({file_size_kb:.1f} KB)")
        
        if file_size_kb > max_size_kb:
            print(f"  Warning: file size {file_size_kb:.1f} KB exceeds {max_size_kb} KB")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to process {url}: {e}")
        return False


def generate_attribution_md(sources):
    """Generate ATTRIBUTION.md with all image sources and licenses."""
    attribution_path = OUTPUT_DIR / 'ATTRIBUTION.md'
    
    with open(attribution_path, 'w', encoding='utf-8') as f:
        f.write("# Skin Banner Image Attribution\n\n")
        f.write("All images used in skin banners are licensed for free use and redistribution.\n\n")
        f.write("## Licenses\n\n")
        f.write("- **Unsplash License**: Free to use for commercial and non-commercial purposes. No permission needed. [License](https://unsplash.com/license)\n")
        f.write("- **NASA/ESA/Hubble/JWST**: Public domain (U.S. Government work). [Usage Guidelines](https://www.nasa.gov/media/guidelines/)\n\n")
        f.write("## Image Sources\n\n")
        
        # Group by skin
        by_skin = {}
        for slug, page, url, author, license_type, platform in sources:
            if slug not in by_skin:
                by_skin[slug] = []
            by_skin[slug].append((page, url, author, license_type, platform))
        
        for slug in sorted(by_skin.keys()):
            f.write(f"### {slug.capitalize()}\n\n")
            for page, url, author, license_type, platform in by_skin[slug]:
                f.write(f"- **{page}**: [{author}]({url}) — {license_type} ({platform})\n")
            f.write("\n")
        
        f.write("---\n\n")
        f.write("*All images were processed (center-cropped to 1200×400, converted to WebP) for use as banner backgrounds.*\n")
    
    print(f"\n✓ Generated {attribution_path}")


def main():
    """Download and process all banner images."""
    print("Downloading and processing real photo banners...\n")
    
    success_count = 0
    fail_count = 0
    
    for slug, page, url, author, license_type, platform in IMAGE_SOURCES:
        output_path = OUTPUT_DIR / slug / f'{page}.webp'
        if download_and_process_image(url, output_path):
            success_count += 1
        else:
            fail_count += 1
    
    # Generate attribution file
    generate_attribution_md(IMAGE_SOURCES)
    
    print(f"\n{'='*60}")
    print(f"Complete: {success_count} success, {fail_count} failed")
    print(f"Output: {OUTPUT_DIR}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
