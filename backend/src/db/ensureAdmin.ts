import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function ensureAdmin() {
  console.log('Ensuring admin user exists...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Check if admin exists
  const [existing] = await db.select().from(users).where(eq(users.username, 'admin'));
  
  if (existing) {
    // Update password and role
    await db.update(users)
      .set({ password: hashedPassword, role: 'superadmin' })
      .where(eq(users.username, 'admin'));
    console.log('Admin user updated: admin / admin123 (role: superadmin)');
  } else {
    // Create admin
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Super Administrator',
      email: 'admin@lpkimm.com',
      phone: '081234567890',
      role: 'superadmin',
    });
    console.log('Admin user created: admin / admin123 (role: superadmin)');
  }
  
  process.exit(0);
}

ensureAdmin().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
