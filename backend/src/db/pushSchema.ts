import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function pushSchema() {
  console.log('🔧 Pushing schema to database...');
  
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        birthdate DATE,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        department_id INTEGER REFERENCES departments(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        license_plate VARCHAR(20) NOT NULL UNIQUE,
        brand VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        color VARCHAR(30),
        type VARCHAR(30) NOT NULL,
        capacity INTEGER,
        fuel_type VARCHAR(20),
        transmission VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        daily_rate DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_requests (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(20) NOT NULL UNIQUE,
        service_type VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        nik VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        department_id INTEGER NOT NULL REFERENCES departments(id),
        vehicle_purpose VARCHAR(100) NOT NULL,
        purpose_reason TEXT NOT NULL,
        location_type VARCHAR(100) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        agreement BOOLEAN DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        approval1 VARCHAR(20) NOT NULL DEFAULT 'pending',
        approval1_by INTEGER REFERENCES users(id),
        approval1_at TIMESTAMP,
        approval1_notes TEXT,
        approval2 VARCHAR(20) NOT NULL DEFAULT 'pending',
        approval2_by INTEGER REFERENCES users(id),
        approval2_at TIMESTAMP,
        approval2_notes TEXT,
        approval3 VARCHAR(20) NOT NULL DEFAULT 'pending',
        approval3_by INTEGER REFERENCES users(id),
        approval3_at TIMESTAMP,
        approval3_notes TEXT,
        approval4 VARCHAR(20) NOT NULL DEFAULT 'pending',
        approval4_by INTEGER REFERENCES users(id),
        approval4_at TIMESTAMP,
        approval4_notes TEXT,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS telegram_subscribers (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(50) NOT NULL UNIQUE,
        nik VARCHAR(20),
        name VARCHAR(100),
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS form_fields (
        id SERIAL PRIMARY KEY,
        field_key VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(200) NOT NULL,
        field_type VARCHAR(20) NOT NULL DEFAULT 'text',
        group_name VARCHAR(100),
        placeholder VARCHAR(200),
        help_text TEXT,
        validation_rules JSONB,
        default_value TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_required BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        is_system_field BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS form_field_options (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
        value VARCHAR(100) NOT NULL,
        label VARCHAR(200) NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS form_responses (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES vehicle_requests(id) ON DELETE CASCADE,
        field_id INTEGER NOT NULL REFERENCES form_fields(id),
        field_key VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ Schema push complete!');
  } catch (error) {
    console.error('❌ Schema push error:', error);
    // Don't exit with error - tables might already exist with slight differences
    console.log('⚠️ Continuing anyway...');
  } finally {
    await sql.end();
  }
}

pushSchema();
