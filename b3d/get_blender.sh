#!/bin/bash
# Install the official free Blender build into ~/blender (tries several official mirrors, with retries).
set -e
V=${BLENDER_V:-4.2.3}; F=blender-$V-linux-x64.tar.xz; P=release/Blender${V%.*}/$F
[ -x ~/blender/blender ] && { ~/blender/blender --version | head -1; exit 0; }
for u in https://download.blender.org/$P https://mirrors.ocf.berkeley.edu/blender/$P https://ftp.nluug.nl/pub/graphics/blender/$P https://mirror.clarkson.edu/blender/$P https://ftp.halifax.rwth-aachen.de/blender/$P; do
  for i in 1 2; do curl -fsSL --retry 2 -o /tmp/b.tar.xz "$u" && break 2; echo "retry $u"; sleep $((i * 10)); done
done
[ -s /tmp/b.tar.xz ] || { echo "blender download failed"; exit 1; }
mkdir -p ~/blender && tar -xJf /tmp/b.tar.xz -C ~/blender --strip-components=1 && rm /tmp/b.tar.xz
~/blender/blender --version | head -1
