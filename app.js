import express from 'express';
import dotenv from 'dotenv';
import { createDatabaseIfNotExists, createTables } from './init-db.js';

import helmet from 'helmet';
app.use(helmet());

import csurf from 'csurf';
app.use(csurf());


dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: 'salesapp',
  port: process.env.PGPORT,
});

const app = express();
const PORT = 3000;

// 1. Configurar motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// 2. Servir archivos estáticos desde /public si los necesitas
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const initApp = async () => {
  await createDatabaseIfNotExists();
  await createTables();

  // 3. Ruta principal renderizando index.ejs
  app.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(sale_date, 'Month') AS month,
      EXTRACT(MONTH FROM sale_date) AS month_num,
      SUM(s.quantity * p.price) AS total_amount
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE EXTRACT(YEAR FROM sale_date) = 2025
    GROUP BY month, month_num
    ORDER BY month_num;
  `);

  const salesData = result.rows.map(row => ({
    month: row.month.trim(),
    total: parseFloat(row.total_amount)
  }));

  res.render('index', { salesData });
  });

  app.post('/products', async (req, res) => {
  const name = req.body.name?.trim();
  const price = parseFloat(req.body.price);

  if (!name || name.length > 100 || isNaN(price) || price <= 0) {
    return res.status(400).send('Invalid product data');
  }

  try {
    await pool.query(
      'INSERT INTO products (name, price) VALUES ($1, $2)',
      [name, price]
    );
    res.redirect('/products');
  } catch (err) {
    console.error('Error inserting product:', err);
    res.status(500).send('Error inserting product');
  }
  });


  app.get('/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products ORDER BY id');
  res.render('products', { products: result.rows });
  });

  app.get('/register-sale', async (req, res) => {
    try {
      const customersResult = await pool.query('SELECT id, name FROM customers ORDER BY name');
      const productsResult = await pool.query('SELECT id, name, price FROM products ORDER BY name');

      const customers = customersResult.rows;
      const products = productsResult.rows;

      res.render('register-sale', { customers, products });
    } catch (error) {
      console.error('Error loading customers or products:', error);
      res.status(500).send('Server error');
    }
  });

  app.get('/customers', async (req, res) => {
    const result = await pool.query('SELECT id, name, email FROM customers ORDER BY name');
    res.render('customers', { customers: result.rows });
  });

  app.post('/customers', async (req, res) => {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !name || name.length > 100 ||
      !email || email.length > 100 || !emailRegex.test(email)
    ) {
      return res.status(400).send('Invalid customer data');
    }

    try {
      await pool.query(
        'INSERT INTO customers (name, email) VALUES ($1, $2)',
        [name, email]
      );
      res.redirect('/customers');
    } catch (err) {
      console.error('Error inserting customer:', err);
      if (err.code === '23505') {
        res.status(400).send('Email already exists');
      } else {
        res.status(500).send('Error inserting customer');
      }
    }
  });


 app.post('/register-sale', async (req, res) => {
    const customer_id = parseInt(req.body.customer_id);
    const product_id = parseInt(req.body.product_id);
    const quantity = parseInt(req.body.quantity);

    if (
      isNaN(customer_id) || customer_id <= 0 ||
      isNaN(product_id) || product_id <= 0 ||
      isNaN(quantity) || quantity <= 0
    ) {
      return res.status(400).send('Invalid sale data');
    }

    try {
      await pool.query(
        'INSERT INTO sales (customer_id, product_id, quantity) VALUES ($1, $2, $3)',
        [customer_id, product_id, quantity]
      );

      res.redirect('/register-sale'); // o cambia a '/sales' si haces historial
    } catch (error) {
      console.error('Error registering sale:', error);
      res.status(500).send('Server error while registering sale');
    }
  });


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

initApp();
