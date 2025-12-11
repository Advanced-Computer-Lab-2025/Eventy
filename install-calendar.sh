#!/bin/bash
# Calendar Integration - Installation Script
# Run this to install all required dependencies

echo "🚀 Installing Calendar Integration Dependencies..."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null
then
    echo "❌ npm could not be found. Please install Node.js first."
    exit 1
fi

echo "📦 Installing packages..."
npm install googleapis ical-generator react-big-calendar @react-oauth/google moment

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All dependencies installed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Set up Google Calendar API (see CALENDAR_SETUP.md)"
    echo "2. Add environment variables to .env"
    echo "3. Update database schemas"
    echo "4. Start your server: npm run dev"
    echo "5. Visit: http://localhost:5000/calendar"
    echo ""
    echo "📚 Documentation:"
    echo "- Setup Guide: CALENDAR_SETUP.md"
    echo "- Features: CALENDAR_FEATURES.md"
    echo "- Creative Ideas: CREATIVE_CALENDAR_IDEAS.md"
    echo ""
else
    echo ""
    echo "❌ Installation failed. Please try manually:"
    echo "npm install googleapis ical-generator react-big-calendar @react-oauth/google moment"
    exit 1
fi
