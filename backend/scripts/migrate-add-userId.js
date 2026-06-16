// Migration: Tag existing students with a demo seed userId
// Run this ONCE to migrate existing data: node scripts/migrate-add-userId.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-dashboard';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const studentsCollection = db.collection('students');

    // 1. Create or find the demo seed user
    const DEMO_EMAIL = '__demo_seed__@system.internal';
    let demoUser = await usersCollection.findOne({ email: DEMO_EMAIL });

    if (!demoUser) {
      const result = await usersCollection.insertOne({
        email: DEMO_EMAIL,
        password: '$2a$12$dummy_hash_never_used_for_login_xxxxxxxxxxx', // never used
        name: 'Demo Seed',
        createdAt: new Date()
      });
      demoUser = { _id: result.insertedId };
      console.log(`Created demo seed user: ${demoUser._id}`);
    } else {
      console.log(`Demo seed user already exists: ${demoUser._id}`);
    }

    // 2. Tag all students that don't have a userId
    const untaggedCount = await studentsCollection.countDocuments({ userId: { $exists: false } });
    console.log(`Found ${untaggedCount} students without userId`);

    if (untaggedCount > 0) {
      const result = await studentsCollection.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: demoUser._id } }
      );
      console.log(`Tagged ${result.modifiedCount} students with demo userId`);
    }

    // 3. Drop the old unique index on usn (if it exists)
    try {
      await studentsCollection.dropIndex('usn_1');
      console.log('Dropped old usn_1 unique index');
    } catch (e) {
      console.log('No old usn_1 index to drop (already migrated or never existed)');
    }

    // 4. Verify
    const totalStudents = await studentsCollection.countDocuments({});
    const taggedStudents = await studentsCollection.countDocuments({ userId: { $exists: true } });
    console.log(`\nVerification: ${taggedStudents}/${totalStudents} students have userId`);

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
