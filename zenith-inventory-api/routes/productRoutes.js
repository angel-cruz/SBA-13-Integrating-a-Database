const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();

// POST /api/products - Create a new product
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    return res.status(201).json(savedProduct);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: messages,
      });
    }
    return res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
});

// GET /api/products - Read all products with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortBy, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined && minPrice !== '') {
        const parsedMin = Number(minPrice);
        if (Number.isNaN(parsedMin)) {
          return res.status(400).json({ message: 'minPrice must be a valid number' });
        }
        filter.price.$gte = parsedMin;
      }

      if (maxPrice !== undefined && maxPrice !== '') {
        const parsedMax = Number(maxPrice);
        if (Number.isNaN(parsedMax)) {
          return res.status(400).json({ message: 'maxPrice must be a valid number' });
        }
        filter.price.$lte = parsedMax;
      }

      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sortOption = { price: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Server error retrieving products', error: error.message });
  }
});

// GET /api/products/:id - Read a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Server error retrieving product', error: error.message });
  }
});

// PUT /api/products/:id - Update a product by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: messages,
      });
    }
    return res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
});

// DELETE /api/products/:id - Delete a product by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product deleted successfully', id: deletedProduct._id });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
});

module.exports = router;
