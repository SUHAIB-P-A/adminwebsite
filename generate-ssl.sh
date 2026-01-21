#!/bin/bash

# SSL Certificate Generation Script
# Generates self-signed certificates for development
# For production, use Let's Encrypt via Certbot

SSL_DIR="./ssl"
KEY_FILE="$SSL_DIR/key.pem"
CERT_FILE="$SSL_DIR/cert.pem"
DAYS=365

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}SSL Certificate Generation Script${NC}"

# Create SSL directory if it doesn't exist
if [ ! -d "$SSL_DIR" ]; then
  mkdir -p "$SSL_DIR"
  echo "Created SSL directory: $SSL_DIR"
fi

# Check if certificates already exist
if [ -f "$KEY_FILE" ] && [ -f "$CERT_FILE" ]; then
  echo -e "${YELLOW}SSL certificates already exist in $SSL_DIR${NC}"
  read -p "Do you want to regenerate them? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Keeping existing certificates"
    exit 0
  fi
  rm -f "$KEY_FILE" "$CERT_FILE"
  echo "Removed old certificates"
fi

# Generate self-signed certificate
echo -e "${YELLOW}Generating self-signed SSL certificate for $DAYS days...${NC}"

openssl req -x509 -newkey rsa:4096 -keyout "$KEY_FILE" -out "$CERT_FILE" -days $DAYS -nodes \
  -subj "/C=US/ST=California/L=San Francisco/O=Admin Web/CN=localhost"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}SSL certificates generated successfully!${NC}"
  echo "Certificate: $CERT_FILE"
  echo "Private Key: $KEY_FILE"
  echo ""
  echo "⚠️  These are self-signed certificates for development only!"
  echo "For production, use Let's Encrypt:"
  echo "  1. Install Certbot: sudo apt-get install certbot"
  echo "  2. Generate certificate: certbot certonly --standalone -d yourdomain.com"
  echo "  3. Point nginx to: /etc/letsencrypt/live/yourdomain.com/"
else
  echo -e "${RED}Failed to generate SSL certificates${NC}"
  exit 1
fi
