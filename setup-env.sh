#!/bin/bash
# Setup script to help configure environment variables for EZViet

echo "🚀 EZViet Environment Setup"
echo "============================"
echo ""
echo "This script will help you set up your .env.local file with Supabase credentials."
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local"
        exit 0
    fi
fi

echo "To get your Supabase credentials:"
echo "1. Go to https://supabase.com and sign in (or create an account)"
echo "2. Create a new project (or select an existing one)"
echo "3. Go to Project Settings > API"
echo "4. Copy the following values:"
echo "   - Project URL"
echo "   - anon/public key"
echo "   - service_role key (keep this secret!)"
echo ""
echo "Press Enter to open Supabase Dashboard in your browser..."
read

# Try to open the browser
if command -v open >/dev/null 2>&1; then
    open "https://supabase.com/dashboard"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "https://supabase.com/dashboard"
fi

echo ""
echo "Please enter your Supabase credentials:"
echo ""

read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -sp "SUPABASE_SERVICE_ROLE_KEY (hidden): " SUPABASE_SERVICE_KEY
echo ""
read -p "OPENAI_API_KEY (optional, press Enter to skip): " OPENAI_KEY
read -p "GOOGLE_GENERATIVE_AI_API_KEY (optional, press Enter to skip): " GOOGLE_KEY

# Create .env.local file
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
EOF

if [ ! -z "$OPENAI_KEY" ]; then
    echo "OPENAI_API_KEY=${OPENAI_KEY}" >> .env.local
fi

if [ ! -z "$GOOGLE_KEY" ]; then
    echo "GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_KEY}" >> .env.local
fi

echo ""
echo "✅ .env.local file created successfully!"
echo ""
echo "Next steps:"
echo "1. If using Podman, restart the dev server: ./podman-dev.sh restart"
echo "2. Or run: npm run dev"
echo ""
