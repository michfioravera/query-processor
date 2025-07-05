// server.js - Per test locale con Express

const express = require('express');
const app = express();

app.use(express.static('.')); // Serve i file statici

app.get('/api', (req, res) => {
  const merged = {};
  
  // In Express, req.query contiene già i parametri parsati
  // ma dobbiamo gestire i duplicati manualmente
  const rawQuery = req.url.split('?')[1] || '';
  const params = new URLSearchParams(rawQuery);
  
  const allParams = {};
  for (const [key, value] of params) {
    if (!allParams[key]) {
      allParams[key] = [];
    }
    allParams[key].push(value);
  }
  
  // Processa tutti i parametri
  for (const [key, values] of Object.entries(allParams)) {
    const allValues = [];
    
    for (const value of values) {
      if (value) {
        const subValues = value.split(',').map(v => v.trim()).filter(v => v);
        allValues.push(...subValues);
      }
    }
    
    const uniqueValues = [...new Set(allValues)];
    
    if (uniqueValues.length > 0) {
      merged[key] = uniqueValues.join(',');
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    parameters: merged
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
