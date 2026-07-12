import mongoose from 'mongoose';
import 'dotenv/config';
import { Customer } from '../models/Customer.js';
import { Transaction } from '../models/Transaction.js';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // We can't rely on the Customer schema strictly if we removed 'transactions' from it.
    // However, Mongoose allows accessing properties that are in the database even if they are not in the strict schema 
    // by using .lean() or .collection.find().
    
    console.log('Fetching customers from database collection directly...');
    const customers = await mongoose.connection.collection('customers').find({}).toArray();
    console.log(`Found ${customers.length} customers.`);

    let insertedCount = 0;
    
    for (const customer of customers) {
      if (!customer.transactions || !Array.isArray(customer.transactions) || customer.transactions.length === 0) {
        continue;
      }
      
      const inserts = customer.transactions.map((tx) => ({
        customerId: customer._id,
        ownerId: customer.ownerId,
        id: tx.id || `${customer._id}-${Date.now()}-${Math.random()}`,
        type: tx.type,
        amount: tx.amount,
        note: tx.note || '',
        date: tx.date || new Date(),
        balance: tx.balance || 0,
      }));
      
      // Delete existing to avoid duplicates if run multiple times
      await Transaction.deleteMany({ customerId: customer._id });
      await Transaction.insertMany(inserts);
      insertedCount += inserts.length;
      
      console.log(`Migrated ${inserts.length} transactions for customer ${customer._id}`);
      
      // Remove transactions from the customer document
      await mongoose.connection.collection('customers').updateOne(
        { _id: customer._id },
        { $unset: { transactions: 1 } }
      );
    }
    
    console.log(`Migration complete! Successfully migrated ${insertedCount} transactions.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
