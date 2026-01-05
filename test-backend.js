fetch('http://localhost:3001/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Backend is working!');
    console.log('Response:', JSON.stringify(data, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Backend is NOT working:', err.message);
    process.exit(1);
  });
