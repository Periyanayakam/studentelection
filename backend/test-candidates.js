const fetch = require('node-fetch'); // wait, I can just use native fetch in node 18+

async function run() {
  const login = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@voting.com', password: 'password123', role: 'admin' })
  }).then(r => r.json());

  console.log("LOGIN:", login);

  if (login.success) {
    const cands = await fetch('http://localhost:5000/api/candidates', {
      headers: { 'Authorization': 'Bearer ' + login.token }
    }).then(r => r.json());
    console.log("CANDIDATES:", cands);
  }
}
run();
