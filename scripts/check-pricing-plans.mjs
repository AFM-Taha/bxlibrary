import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Import models
import '../models/Pricing.js';
const Pricing = mongoose.model('Pricing');

async function checkPricingPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all pricing plans
    const plans = await Pricing.find({}).sort({ sortOrder: 1 });
    
    console.log('\n=== PRICING PLANS ===');
    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.name}:`);
      console.log(`   ID: ${plan._id}`);
      console.log(`   Price: ${plan.price} ${plan.currency}`);
      console.log(`   Billing Period: ${plan.billingPeriod}`);
      console.log(`   Description: ${plan.description || 'N/A'}`);
      console.log(`   Is Active: ${plan.isActive}`);
      console.log(`   Is Popular: ${plan.isPopular}`);
      console.log(`   Sort Order: ${plan.sortOrder}`);
      console.log(`   Button Text: ${plan.buttonText}`);
      console.log(`   Features: ${plan.features?.length || 0} features`);
      if (plan.features && plan.features.length > 0) {
        plan.features.forEach((feature, i) => {
          console.log(`     - ${feature.name} (${feature.included ? 'included' : 'not included'})`);
        });
      }
    });

    // Check for any potential issues
    console.log('\n=== POTENTIAL ISSUES ===');
    const issues = [];
    
    plans.forEach(plan => {
      if (!plan.price || plan.price <= 0) {
        issues.push(`${plan.name}: Invalid price (${plan.price})`);
      }
      if (!plan.currency) {
        issues.push(`${plan.name}: Missing currency`);
      }
      if (!plan.description || plan.description.trim() === '') {
        issues.push(`${plan.name}: Missing or empty description`);
      }
      if (!plan.billingPeriod) {
        issues.push(`${plan.name}: Missing billing period`);
      }
    });
    
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`⚠️  ${issue}`));
    } else {
      console.log('✅ No obvious issues found in pricing plans');
    }

  } catch (error) {
    console.error('Error checking pricing plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkPricingPlans();