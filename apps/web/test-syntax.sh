#!/bin/bash

echo "Testing syntax of ProfilePreview component..."

cd /home/engine/project/apps/web

# Test if we can read the file without syntax errors
echo "Checking file syntax..."

# Check for basic syntax issues
if grep -q "export function ProfilePreview" src/components/profile-preview.tsx; then
    echo "✅ ProfilePreview function found"
else
    echo "❌ ProfilePreview function NOT found"
fi

# Count braces to verify they're balanced
open_braces=$(grep -o "{" src/components/profile-preview.tsx | wc -l)
close_braces=$(grep -o "}" src/components/profile-preview.tsx | wc -l)

echo "Opening braces: $open_braces"
echo "Closing braces: $close_braces"

if [ "$open_braces" -eq "$close_braces" ]; then
    echo "✅ Braces are balanced"
else
    echo "❌ Braces are NOT balanced"
fi

# Check for the closing of the main function
if grep -q "return <div>Invalid ProfilePreview props</div>;" src/components/profile-preview.tsx; then
    echo "✅ Fallback return statement found"
else
    echo "❌ Fallback return statement NOT found"
fi

# Check if the file ends properly
last_line=$(tail -n 1 src/components/profile-preview.tsx)
if [ "$last_line" = "}" ]; then
    echo "✅ File ends with closing brace"
else
    echo "❌ File does NOT end with closing brace, last line: $last_line"
fi

echo ""
echo "Syntax check completed!"