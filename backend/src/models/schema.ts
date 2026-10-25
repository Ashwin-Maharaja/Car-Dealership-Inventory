export interface SchemaDatabase {
  exec(sql: string): void;
}

/**
 * Initializes the database schema by creating all required tables
 * if they do not already exist.
 */
export function initializeSchema(db: SchemaDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'staff')) DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Sedan',
      year INTEGER NOT NULL DEFAULT 2024,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
      mileage INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT 'Black',
      vin TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK (status IN ('available', 'sold', 'pending')) DEFAULT 'available',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      sale_price REAL NOT NULL,
      sale_date TEXT NOT NULL DEFAULT (date('now')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(make);
    CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
    CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
    CREATE INDEX IF NOT EXISTS idx_vehicles_quantity ON vehicles(quantity);
    CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON sales(vehicle_id);
  `);
}
