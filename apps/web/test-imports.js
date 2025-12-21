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

