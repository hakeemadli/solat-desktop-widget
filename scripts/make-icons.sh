#!/usr/bin/env bash
# Menjana ikon aplikasi & tray daripada bentuk vektor ringkas (ImageMagick).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets

CARD="#0b2a22"
CARD_RING="#1f6b53"
MINT="#4ade9f"
MINT_DIM="#123c31"
GOLD="#fbbf24"

# --- Ikon utama 256x256: bulan sabit + bintang pada kad hijau gelap ---
convert -size 256x256 xc:none \
  -fill "$CARD" -draw "roundrectangle 6,6 249,249 56,56" \
  -stroke "$CARD_RING" -strokewidth 3 -fill none -draw "roundrectangle 10,10 245,245 52,52" \
  -stroke none \
  -fill "$MINT" -draw "circle 112,132 112,58" \
  -fill "$CARD" -draw "circle 152,106 152,38" \
  -fill "$GOLD" -draw "polygon 192,142 199,161 218,168 199,175 192,194 185,175 166,168 185,161" \
  assets/icon-256.png

# --- Ikon tray (imej kecil perlu lebih tebal & kontras) ---
convert -size 256x256 xc:none \
  -fill "$MINT" -draw "circle 120,132 120,48" \
  -fill none -draw "circle 163,100 163,16" \
  -fill "$GOLD" -draw "polygon 188,142 196,165 219,173 196,181 188,204 180,181 157,173 180,165" \
  -background none -alpha set \
  assets/tray-source.png

convert assets/tray-source.png -resize 32x32 assets/tray-32.png
convert assets/tray-source.png -resize 20x20 assets/tray-20.png
convert assets/tray-source.png -resize 16x16 assets/tray-16.png

# --- ICO berbilang saiz untuk Windows ---
convert assets/icon-256.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico

rm -f assets/tray-source.png

echo "Ikon dijana:"
ls -1 assets
