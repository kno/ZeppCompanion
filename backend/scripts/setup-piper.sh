#!/usr/bin/env bash
set -euo pipefail

# Setup script for Piper TTS
# Downloads the piper binary and Spanish voice model into backend/piper/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PIPER_DIR="$BACKEND_DIR/piper"
PIPER_VERSION="2023.11.14-2"

echo "Setting up Piper TTS in $PIPER_DIR"
mkdir -p "$PIPER_DIR"

# ----- Detect platform -----
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64)  PIPER_ARCHIVE="piper_macos_aarch64.tar.gz" ;;
      x86_64) PIPER_ARCHIVE="piper_macos_x86_64.tar.gz" ;;
      *) echo "Unsupported macOS architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64) PIPER_ARCHIVE="piper_linux_x86_64.tar.gz" ;;
      aarch64) PIPER_ARCHIVE="piper_linux_aarch64.tar.gz" ;;
      *) echo "Unsupported Linux architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

PIPER_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/${PIPER_ARCHIVE}"

# ----- Download piper binary -----
if [ -f "$PIPER_DIR/piper" ]; then
  echo "Piper binary already exists at $PIPER_DIR/piper, skipping download."
else
  echo "Downloading piper binary from $PIPER_URL ..."
  TMP_ARCHIVE="$(mktemp /tmp/piper_XXXXXX.tar.gz)"
  curl -fsSL -o "$TMP_ARCHIVE" "$PIPER_URL"
  tar -xzf "$TMP_ARCHIVE" -C "$PIPER_DIR" --strip-components=1
  rm -f "$TMP_ARCHIVE"
  chmod +x "$PIPER_DIR/piper"
  echo "Piper binary installed at $PIPER_DIR/piper"
fi

# ----- Download Spanish voice model -----
MODEL_NAME="es_MX-claude-high"
MODEL_FILE="$PIPER_DIR/${MODEL_NAME}.onnx"
MODEL_JSON="$PIPER_DIR/${MODEL_NAME}.onnx.json"

HF_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high"

if [ -f "$MODEL_FILE" ] && [ -f "$MODEL_JSON" ]; then
  echo "Voice model already exists at $MODEL_FILE, skipping download."
else
  echo "Downloading Spanish voice model (es_MX-claude-high) from Hugging Face ..."
  curl -fsSL -o "$MODEL_FILE" "${HF_BASE}/es_MX-claude-high.onnx"
  curl -fsSL -o "$MODEL_JSON" "${HF_BASE}/es_MX-claude-high.onnx.json"
  echo "Voice model installed at $MODEL_FILE"
fi

# ----- Done -----
echo ""
echo "Setup complete! Add these variables to your .env file:"
echo ""
echo "  TTS_ENABLED=true"
echo "  PIPER_BINARY_PATH=${PIPER_DIR}/piper"
echo "  PIPER_MODEL_PATH=${MODEL_FILE}"
echo ""
echo "Or use relative paths if running from the backend directory:"
echo ""
echo "  TTS_ENABLED=true"
echo "  PIPER_BINARY_PATH=./piper/piper"
echo "  PIPER_MODEL_PATH=./piper/${MODEL_NAME}.onnx"
echo ""
