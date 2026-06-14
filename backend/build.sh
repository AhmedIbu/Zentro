#!/usr/bin/env bash
# Render build script: installs node deps + downloads standalone yt-dlp & ffmpeg
# binaries into ./bin so no system package manager (sudo/apt) is required.
set -euo pipefail

echo "==> Installing node dependencies"
npm install

mkdir -p bin

echo "==> Downloading yt-dlp (standalone linux binary, no python needed)"
curl -fL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o bin/yt-dlp
chmod +x bin/yt-dlp

echo "==> Downloading static ffmpeg + ffprobe"
curl -fL https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz
FFDIR="$(find . -maxdepth 1 -type d -name 'ffmpeg-master-latest-linux64-gpl*' | head -n1)"
cp "$FFDIR/bin/ffmpeg" bin/ffmpeg
cp "$FFDIR/bin/ffprobe" bin/ffprobe
chmod +x bin/ffmpeg bin/ffprobe
rm -rf ffmpeg.tar.xz "$FFDIR"

echo "==> Verifying binaries"
./bin/yt-dlp --version
./bin/ffmpeg -version | head -n1

echo "==> Build complete"
