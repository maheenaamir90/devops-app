const express = require('express');
const client = require('prom-client');

const app = express();

// collect default metrics
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/', (req, res) => {
  res.send("DevOps App Running 🚀");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
