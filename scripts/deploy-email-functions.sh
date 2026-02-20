#!/bin/bash

# Deploy Email Edge Functions to Supabase
# This script deploys all 5 auth email functions and sets up the Resend API key

set -e  # Exit on error

echo "🚀 Deploying V-Life Email Edge Functions..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}Step 1: Setting Resend API Key Secret${NC}"
echo "This will store your RESEND_API_KEY securely in Supabase..."

# Check if RESEND_API_KEY is provided
if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  RESEND_API_KEY not set in environment${NC}"
    echo "Please set it first:"
    echo "  export RESEND_API_KEY=re_YOUR_API_KEY"
    echo ""
    echo "Or run this script with:"
    echo "  RESEND_API_KEY=re_YOUR_API_KEY ./scripts/deploy-email-functions.sh"
    exit 1
fi

# Set the secret
echo "Setting RESEND_API_KEY secret..."
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"
echo -e "${GREEN}✓ Secret set successfully${NC}"
echo ""

echo -e "${BLUE}Step 2: Deploying Edge Functions${NC}"
echo "Deploying all 5 email functions..."
echo ""

# Deploy each function
FUNCTIONS=(
    "send-signup-email"
    "send-magic-link"
    "send-password-reset"
    "send-change-email"
    "send-invite-user"
)

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying $func..."
    supabase functions deploy "$func" --no-verify-jwt
    echo -e "${GREEN}✓ $func deployed${NC}"
    echo ""
done

echo -e "${GREEN}🎉 All email functions deployed successfully!${NC}"
echo ""

echo -e "${BLUE}Step 3: Configure Auth Hooks${NC}"
echo "⚠️  Manual step required:"
echo ""
echo "Go to your Supabase Dashboard → Authentication → Hooks"
echo "Enable and configure the following hooks:"
echo ""
echo "1. Confirm Signup → send-signup-email"
echo "2. Magic Link → send-magic-link"
echo "3. Recovery → send-password-reset"
echo "4. Email Change → send-change-email"
echo "5. Invite User → send-invite-user"
echo ""
echo "See docs/EMAIL_EDGE_FUNCTIONS.md for detailed instructions."
echo ""

echo -e "${BLUE}Step 4: Test Email Sending${NC}"
echo "Test by:"
echo "  1. Creating a new account (signup email)"
echo "  2. Requesting password reset (password reset email)"
echo "  3. Using magic link login (magic link email)"
echo ""

echo "View function logs with:"
echo "  supabase functions logs send-signup-email --follow"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
