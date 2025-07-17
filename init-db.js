import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

dotenv.config();
const { Client, Pool } = pg;

const dbName = 'salesapp';

const insertDummyData = async (pool) => {
  const insertCSV = async (filePath, table, columns) => {
    return new Promise((resolve, reject) => {
      const records = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => records.push(data))
        .on('end', async () => {
          for (const row of records) {
            const values = columns.map(col => row[col]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
            const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
            await pool.query(sql, values);
          }
          console.log(`✔ Inserted data into ${table}`);
          resolve();
        })
        .on('error', reject);
    });
  };

  try {
    await insertCSV(path.resolve('data/customers.csv'), 'customers', ['name', 'email']);
    await insertCSV(path.resolve('data/products.csv'), 'products', ['name', 'price']);
    await insertCSV(path.resolve('data/sales.csv'), 'sales', ['customer_id', 'product_id', 'quantity', 'sale_date']);
  } catch (err) {
    console.error('Error inserting CSV data:', err);
  }
};

export const createDatabaseIfNotExists = async () => {
  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
};

export const createTables = async () => {
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: dbName,
  });

  try {
    await pool.query(`
      DROP TABLE IF EXISTS sales;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS products;
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created successfully in 'salesapp'.");
    await insertDummyData(pool);
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await pool.end();
  }
};
