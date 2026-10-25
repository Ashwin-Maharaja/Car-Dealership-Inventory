/**
 * Seed script — populates the database with realistic sample data.
 * Run with: npm run seed
 */
import dotenv from "dotenv";
dotenv.config();

import db from "./config/database.js";
import bcrypt from "bcryptjs";

console.log("🌱 Seeding database...\n");

// ─── Users ───────────────────────────────────────────────────────────────────

const passwordHash = bcrypt.hashSync("password123", 12);

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)"
);

const users = [
  { email: "admin@dealership.com", name: "Sarah Johnson (Admin)", role: "admin" },
  { email: "admin@autodealer.com", name: "Alex Admin", role: "admin" },
  { email: "user@dealership.com", name: "John Buyer (Customer)", role: "user" },
  { email: "mike@dealership.com", name: "Mike Thompson (Staff)", role: "staff" },
  { email: "jessica@dealership.com", name: "Jessica Lee (Staff)", role: "staff" },
  { email: "staff@autodealer.com", name: "Sam Staff", role: "staff" },
];

for (const u of users) {
  insertUser.run(u.email, passwordHash, u.name, u.role);
}
console.log(`✅ Seeded ${users.length} users (password: password123)`);

// ─── Vehicles ────────────────────────────────────────────────────────────────

const insertVehicle = db.prepare(
  `INSERT OR IGNORE INTO vehicles
     (make, model, category, year, price, quantity, mileage, color, vin, status, description, image_url)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const vehicles = [
  {
    make: "Toyota", model: "Camry", category: "Sedan", year: 2023, price: 28999.99, quantity: 4, mileage: 12500,
    color: "Pearl White", vin: "1HGBH41JXMN109186", status: "available",
    description: "Well-maintained sedan with excellent fuel economy. Features include adaptive cruise control, lane departure warning, and a 10.5-inch touchscreen display.",
    image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800",
  },
  {
    make: "Honda", model: "CR-V", category: "SUV", year: 2024, price: 34500.00, quantity: 3, mileage: 3200,
    color: "Meteorite Gray", vin: "2HKRW2H55MH654321", status: "available",
    description: "Nearly new compact SUV with Honda Sensing suite. AWD, heated seats, wireless Apple CarPlay and Android Auto.",
    image_url: "https://images.unsplash.com/photo-1568844293986-8d0400f4e955?w=800",
  },
  {
    make: "Ford", model: "F-150", category: "Truck", year: 2022, price: 42750.00, quantity: 2, mileage: 28000,
    color: "Iconic Silver", vin: "1FTEW1EP5MFA98765", status: "available",
    description: "Powerful pickup truck with 3.5L EcoBoost V6 engine. Lariat trim with leather interior, B&O sound system, and towing package.",
    image_url: "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=800",
  },
  {
    make: "Tesla", model: "Model 3", category: "Electric", year: 2023, price: 39990.00, quantity: 5, mileage: 8500,
    color: "Midnight Blue", vin: "5YJ3E1EA7PF123456", status: "available",
    description: "Long Range AWD with Autopilot. 358-mile range, premium interior, glass roof, and 15-inch center touchscreen.",
    image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
  },
  {
    make: "BMW", model: "X5", category: "SUV", year: 2023, price: 62500.00, quantity: 2, mileage: 15000,
    color: "Alpine White", vin: "5UXCR6C05P9A11223", status: "available",
    description: "Luxury midsize SUV with xDrive40i. M Sport package, panoramic sunroof, Harman Kardon sound, and driving assistance professional.",
    image_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
  },
  {
    make: "Mercedes-Benz", model: "C-Class", category: "Sedan", year: 2024, price: 48900.00, quantity: 1, mileage: 5100,
    color: "Obsidian Black", vin: "WDDWF8DB2PA334455", status: "available",
    description: "Refined luxury sedan with AMG Line exterior. MBUX infotainment, 64-color ambient lighting, and Burmester surround sound.",
    image_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
  },
  {
    make: "Chevrolet", model: "Tahoe", category: "SUV", year: 2023, price: 56200.00, quantity: 0, mileage: 19000,
    color: "Black", vin: "1GNSKBKD5PR556677", status: "sold",
    description: "Full-size SUV with 5.3L V8. Z71 off-road package, magnetic ride control, rear entertainment system, and third-row seating. Currently Out of Stock.",
    image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
  },
  {
    make: "Audi", model: "A4", category: "Sedan", year: 2023, price: 43250.00, quantity: 3, mileage: 11000,
    color: "Navarra Blue", vin: "WAUEAAF40PA778899", status: "available",
    description: "Premium compact sedan with quattro AWD. Virtual cockpit plus, Bang & Olufsen 3D sound, and S line sport package.",
    image_url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
  },
  {
    make: "Jeep", model: "Grand Cherokee", category: "SUV", year: 2024, price: 52800.00, quantity: 2, mileage: 4500,
    color: "Velvet Red", vin: "1C4RJFBG7PC990011", status: "available",
    description: "Overland trim with 4x4. Air suspension, McIntosh audio, head-up display, and premium Nappa leather interior.",
    image_url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
  },
  {
    make: "Hyundai", model: "Tucson", category: "SUV", year: 2024, price: 31400.00, quantity: 4, mileage: 6800,
    color: "Amazon Gray", vin: "5NMJFDAE5PH112233", status: "available",
    description: "Compact SUV with hybrid powertrain. Limited trim with panoramic sunroof, Bose audio, and highway driving assist.",
    image_url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
  },
  {
    make: "Porsche", model: "911 Carrera", category: "Coupe", year: 2023, price: 115000.00, quantity: 1, mileage: 4200,
    color: "Guards Red", vin: "WP0AB2A92PS112233", status: "available",
    description: "Iconic sports coupe featuring twin-turbo 3.0L flat-six, PDK 8-speed transmission, Sport Chrono package, and sport exhaust.",
    image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
  },
  {
    make: "Subaru", model: "Outback", category: "Crossover", year: 2023, price: 35600.00, quantity: 0, mileage: 17500,
    color: "Autumn Green", vin: "4S4BTAPC5P3667788", status: "sold",
    description: "Wilderness trim with raised suspension and all-terrain tires. EyeSight driver assist, StarLink multimedia, and roof rails.",
    image_url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
  },
];

for (const v of vehicles) {
  insertVehicle.run(
    v.make, v.model, v.category, v.year, v.price, v.quantity, v.mileage,
    v.color, v.vin, v.status, v.description, v.image_url
  );
}
console.log(`✅ Seeded ${vehicles.length} vehicles`);

// ─── Customers ───────────────────────────────────────────────────────────────

const insertCustomer = db.prepare(
  "INSERT OR IGNORE INTO customers (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)"
);

const customers = [
  { first_name: "James", last_name: "Wilson", email: "james.wilson@email.com", phone: "(555) 123-4567", address: "123 Oak Street, Springfield, IL 62701" },
  { first_name: "Emily", last_name: "Chen", email: "emily.chen@email.com", phone: "(555) 234-5678", address: "456 Maple Avenue, Portland, OR 97201" },
  { first_name: "David", last_name: "Martinez", email: "david.martinez@email.com", phone: "(555) 345-6789", address: "789 Pine Road, Austin, TX 73301" },
  { first_name: "Sophia", last_name: "Patel", email: "sophia.patel@email.com", phone: "(555) 456-7890", address: "321 Elm Boulevard, Denver, CO 80201" },
  { first_name: "Robert", last_name: "Kim", email: "robert.kim@email.com", phone: "(555) 567-8901", address: "654 Cedar Lane, Seattle, WA 98101" },
  { first_name: "Olivia", last_name: "Brown", email: "olivia.brown@email.com", phone: "(555) 678-9012", address: "987 Birch Drive, Nashville, TN 37201" },
];

for (const c of customers) {
  insertCustomer.run(c.first_name, c.last_name, c.email, c.phone, c.address);
}
console.log(`✅ Seeded ${customers.length} customers`);

// ─── Sales ───────────────────────────────────────────────────────────────────

const insertSale = db.prepare(
  `INSERT OR IGNORE INTO sales (vehicle_id, customer_id, user_id, sale_price, sale_date, notes)
   VALUES (?, ?, ?, ?, ?, ?)`
);

const tahoe = db.prepare("SELECT id FROM vehicles WHERE vin = '1GNSKBKD5PR556677'").get() as { id: number } | undefined;
const outback = db.prepare("SELECT id FROM vehicles WHERE vin = '4S4BTAPC5P3667788'").get() as { id: number } | undefined;
const adminUser = db.prepare("SELECT id FROM users WHERE email = 'admin@dealership.com'").get() as { id: number } | undefined;
const jamesId = db.prepare("SELECT id FROM customers WHERE email = 'james.wilson@email.com'").get() as { id: number } | undefined;
const emilyId = db.prepare("SELECT id FROM customers WHERE email = 'emily.chen@email.com'").get() as { id: number } | undefined;

if (tahoe && outback && adminUser && jamesId && emilyId) {
  insertSale.run(tahoe.id, jamesId.id, adminUser.id, 56200.00, "2024-09-15", "Sold last unit in stock.");
  insertSale.run(outback.id, emilyId.id, adminUser.id, 35600.00, "2024-10-02", "Wilderness package special purchase.");
  console.log(`✅ Seeded 2 initial sales records`);
}

console.log("\n🎉 Database seeding complete!");
console.log("   Admin: admin@dealership.com / password123");
console.log("   User:  user@dealership.com  / password123");
