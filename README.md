# Sales-Web-App

**Disclaimer**  
> This project is provided for **educational and development purposes only**.  
> It is **not suitable for production** without proper validation, authentication, security, and error handling.  
> Use it at your own risk.  
> All data included (names, emails, prices) is fictional.

---

A simple web application to register clients, products, and sales, with a dashboard that shows monthly sales in dollars using Chart.js and PostgreSQL.

---

## Features

- Register and manage customers and products  
- Register sales with quantity and date  
- Dashboard showing total monthly revenue (2025)  
- Responsive Bootstrap 5 UI with EJS views  
- PostgreSQL database with auto creation and CSV-based seed data

---

## Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)  
- [PostgreSQL](https://www.postgresql.org/) running locally or via Docker

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/patocastro/Sales-Web-App
cd Sales-Web-App
```

2. **Install dependencies**

```bash
npm install
```
3. **Configure environment variables**

```bash
cp .env.example .env
```
4. **Run the app**

```bash
npm start
```