const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/devopsdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Simple data model
const Item = mongoose.model('Item', new mongoose.Schema({ name: String, date: Date }));

// Routes
app.get('/', (req, res) => {
  res.send('<h1>DevOps App Running!</h1><p>Use /items to see data</p>');
});

app.get('/items', async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post('/add', async (req, res) => {
  const item = new Item({ name: req.body.name, date: new Date() });
  await item.save();
  res.json({ message: 'Item saved', item });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(3000, () => console.log('App running on port 3000'));