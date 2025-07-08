const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple file-based storage
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Helper functions
const readData = (filename) => {
  const filePath = path.join(dataDir, `${filename}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
};

const writeData = (filename, data) => {
  const filePath = path.join(dataDir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize data files
if (!fs.existsSync(path.join(dataDir, 'products.json'))) {
  writeData('products', [
    { id: '1', name: 'Sample Product 1', sku: 'SKU001', price: 29.99, stock: 100 },
    { id: '2', name: 'Sample Product 2', sku: 'SKU002', price: 49.99, stock: 50 }
  ]);
}

if (!fs.existsSync(path.join(dataDir, 'orders.json'))) {
  writeData('orders', []);
}

// API Routes

// Products
app.get('/api/products', (req, res) => {
  const products = readData('products');
  res.json({ success: true, data: products });
});

app.post('/api/products', (req, res) => {
  const products = readData('products');
  const newProduct = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  writeData('products', products);
  
  console.log('📦 New product created:', newProduct);
  res.json({ success: true, data: newProduct });
});

app.put('/api/products/:id', (req, res) => {
  const products = readData('products');
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData('products', products);
    console.log('📦 Product updated:', products[index]);
    res.json({ success: true, data: products[index] });
  } else {
    res.status(404).json({ success: false, error: 'Product not found' });
  }
});

// Orders
app.get('/api/orders', (req, res) => {
  const orders = readData('orders');
  res.json({ success: true, data: orders });
});

app.post('/api/orders', (req, res) => {
  const orders = readData('orders');
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  writeData('orders', orders);
  
  console.log('🛒 New order received:', newOrder);
  res.json({ success: true, data: newOrder });
});

app.put('/api/orders/:id/status', (req, res) => {
  const orders = readData('orders');
  const index = orders.findIndex(o => o.id === req.params.id);
  
  if (index !== -1) {
    orders[index].status = req.body.status;
    orders[index].updatedAt = new Date().toISOString();
    writeData('orders', orders);
    console.log('🛒 Order status updated:', orders[index]);
    res.json({ success: true, data: orders[index] });
  } else {
    res.status(404).json({ success: false, error: 'Order not found' });
  }
});

// Inventory updates
app.put('/api/inventory/:productId', (req, res) => {
  const products = readData('products');
  const index = products.findIndex(p => p.id === req.params.productId);
  
  if (index !== -1) {
    products[index].stock = req.body.stock;
    products[index].updatedAt = new Date().toISOString();
    writeData('products', products);
    console.log('📊 Inventory updated:', products[index]);
    res.json({ success: true, data: products[index] });
  } else {
    res.status(404).json({ success: false, error: 'Product not found' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Mock ERP Server is running!', timestamp: new Date().toISOString() });
});

// Webhook endpoint (to receive updates from Shopify via your Gadget app)
app.post('/api/webhooks/shopify', (req, res) => {
  console.log('🔔 Webhook received from Shopify:', req.body);
  
  // Log the webhook to a file
  const webhooks = readData('webhooks') || [];
  webhooks.push({
    id: Date.now().toString(),
    data: req.body,
    receivedAt: new Date().toISOString()
  });
  writeData('webhooks', webhooks);
  
  res.json({ success: true, message: 'Webhook processed' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock ERP Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/products      - List all products`);
  console.log(`   POST /api/products      - Create product`);
  console.log(`   PUT  /api/products/:id  - Update product`);
  console.log(`   GET  /api/orders        - List all orders`);
  console.log(`   POST /api/orders        - Create order`);
  console.log(`   PUT  /api/orders/:id/status - Update order status`);
  console.log(`   PUT  /api/inventory/:id - Update inventory`);
  console.log(`   POST /api/webhooks/shopify - Webhook endpoint`);
  console.log(`   GET  /api/health        - Health check`);
});