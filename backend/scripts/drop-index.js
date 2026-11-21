import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('Successfully dropped legacy username_1 index');
    } catch (err) {
      console.log('Error dropping index or it does not exist:', err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
