require('dotenv').config();
const express = require('express');
const connectDB = require('./config/connection');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.use('/api/products', productRoutes);

app.listen(PORT, () => {
  console.log(`Zenith Inventory API running on port ${PORT}`);
});
