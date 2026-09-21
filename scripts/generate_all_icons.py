import os
from PIL import Image

def generate():
    # 1. Base image from icon.png
    src = Image.open('assets/images/icon.png').convert('RGBA')
    bike_crop = src.crop((160, 270, 860, 750))
    w, h = bike_crop.size
    px = bike_crop.load()

    # Feather edges to black
    feather = 40
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dist_x = min(x, w - 1 - x)
            dist_y = min(y, h - 1 - y)
            dist = min(dist_x, dist_y)
            if dist < feather:
                factor = dist / float(feather)
                px[x, y] = (int(r * factor), int(g * factor), int(b * factor), a)

    # Master 1024x1024 black canvas
    master_1024 = Image.new('RGBA', (1024, 1024), (0, 0, 0, 255))
    paste_x = (1024 - w) // 2
    paste_y = (1024 - h) // 2
    master_1024.paste(bike_crop, (paste_x, paste_y))

    # Master transparent canvas for adaptive foreground
    master_transparent = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    t_px = master_transparent.load()
    # Fill bike onto transparent canvas with alpha proportional to brightness
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            brightness = max(r, g, b)
            if brightness > 10:
                alpha = min(255, int(brightness * 1.5))
                t_px[paste_x + x, paste_y + y] = (r, g, b, alpha)

    # Save assets/images
    master_1024.save('assets/images/icon.png')
    master_1024.resize((512, 512), Image.Resampling.LANCZOS).save('assets/images/splash-icon.png')
    master_1024.resize((512, 512), Image.Resampling.LANCZOS).save('assets/images/android-icon-background.png')
    master_transparent.resize((512, 512), Image.Resampling.LANCZOS).save('assets/images/android-icon-foreground.png')
    print('Updated assets/images/ icons')

    # Drawables for Android SplashScreen (black canvas with neon bike)
    # The splash icon in Android 12 is placed in an icon viewport.
    splash_densities = {
        'drawable-mdpi': 288,
        'drawable-hdpi': 432,
        'drawable-xhdpi': 576,
        'drawable-xxhdpi': 864,
        'drawable-xxxhdpi': 1152,
    }

    for folder, dim in splash_densities.items():
        out_dir = os.path.join('android/app/src/main/res', folder)
        os.makedirs(out_dir, exist_ok=True)
        img = master_1024.resize((dim, dim), Image.Resampling.LANCZOS)
        img.save(os.path.join(out_dir, 'splashscreen_logo.png'))
        print(f'Generated {folder}/splashscreen_logo.png ({dim}x{dim})')

    # Mipmap launcher icons
    # Adaptive foreground dimensions:
    fg_densities = {
        'mipmap-mdpi': 108,
        'mipmap-hdpi': 162,
        'mipmap-xhdpi': 216,
        'mipmap-xxhdpi': 324,
        'mipmap-xxxhdpi': 432,
    }
    for folder, dim in fg_densities.items():
        out_dir = os.path.join('android/app/src/main/res', folder)
        os.makedirs(out_dir, exist_ok=True)
        # For adaptive foreground, scale so safe zone (66%) contains the bike
        # master_1024 already has the bike taking ~68% of width.
        fg_img = master_transparent.resize((dim, dim), Image.Resampling.LANCZOS)
        fg_img.save(os.path.join(out_dir, 'ic_launcher_foreground.png'))
        print(f'Generated {folder}/ic_launcher_foreground.png ({dim}x{dim})')

    # Non-adaptive launcher icons (fallback for older android / square / round)
    launcher_densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }
    for folder, dim in launcher_densities.items():
        out_dir = os.path.join('android/app/src/main/res', folder)
        os.makedirs(out_dir, exist_ok=True)
        icon_img = master_1024.resize((dim, dim), Image.Resampling.LANCZOS)
        icon_img.save(os.path.join(out_dir, 'ic_launcher.png'))
        icon_img.save(os.path.join(out_dir, 'ic_launcher_round.png'))
        print(f'Generated {folder}/ic_launcher.png & ic_launcher_round.png ({dim}x{dim})')

if __name__ == '__main__':
    generate()
