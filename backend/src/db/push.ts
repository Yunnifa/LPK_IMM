import { db } from './index';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function push() {
  console.log('Pushing schema to database...');
  try {
    // Note: For push, we'll use drizzle-kit push command
    console.log('Please run: npm run db:push');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
}

push();
