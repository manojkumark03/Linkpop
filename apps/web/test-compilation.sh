#!/bin/bash
# Simple TypeScript compilation test for our new components

echo "Testing ProfilePreview component compilation..."

cd /home/engine/project/apps/web

# Test if we can import our components without errors
cat > test-imports.js << 'EOF'
// Simple import test
try {
  console.log('Testing imports...');
  require('./src/components/profile-preview.tsx');
  console.log('✅ ProfilePreview import test passed');
} catch (e) {
  console.log('❌ ProfilePreview import failed:', e.message);
}

try {
  require('./src/app/dashboard/_components/dashboard-builder.tsx');
  console.log('✅ DashboardBuilder import test passed');
} catch (e) {
  console.log('❌ DashboardBuilder import failed:', e.message);
}

try {
  require('./src/app/dashboard/profile-elements.ts');
  console.log('✅ profile-elements import test passed');
} catch (e) {
  console.log('❌ profile-elements import failed:', e.message);
}

EOF

node test-imports.js