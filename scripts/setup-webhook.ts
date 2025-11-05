#!/usr/bin/env ts-node
/**
 * Automated Telegram Webhook Setup Script
 * 
 * This script automatically configures the Telegram bot webhook to point to your deployment.
 * Run this after deploying or when changing domains/secrets.
 * 
 * Usage:
 *   npm run setup-webhook
 * 
 * Or with custom domain:
 *   DOMAIN=https://custom.domain.com npm run setup-webhook
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function setupWebhook() {
  // Read environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const customDomain = process.env.DOMAIN;
  
  if (!botToken) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN not found in environment variables');
    console.error('💡 Make sure you have .env.local file with TELEGRAM_BOT_TOKEN set');
    process.exit(1);
  }

  // Auto-detect domain or use provided one
  let domain = customDomain;
  if (!domain) {
    // Try to detect from Vercel env
    domain = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://itzfesi.ir'; // fallback
    
    console.log(`🔍 Auto-detected domain: ${domain}`);
  }

  // Build webhook URL
  let webhookUrl = `${domain}/api/telegram-bot/webhook`;
  if (webhookSecret) {
    webhookUrl += `?secret=${encodeURIComponent(webhookSecret)}`;
    console.log('🔐 Webhook secret will be included');
  }

  console.log(`\n🚀 Setting up Telegram webhook...`);
  console.log(`📍 Webhook URL: ${webhookUrl.replace(/secret=[^&]+/, 'secret=***')}`);

  try {
    // Set webhook
    const setResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      }
    );

    const setResult = await setResponse.json();
    
    if (!setResult.ok) {
      console.error('❌ Failed to set webhook:', setResult);
      process.exit(1);
    }

    console.log('✅ Webhook set successfully!\n');

    // Verify webhook
    console.log('🔍 Verifying webhook configuration...');
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const infoResult = await infoResponse.json();

    if (infoResult.ok) {
      const info = infoResult.result;
      console.log('\n📊 Webhook Status:');
      console.log(`   URL: ${info.url || '(not set)'}`);
      console.log(`   Pending updates: ${info.pending_update_count || 0}`);
      console.log(`   Last error: ${info.last_error_message || 'None'}`);
      console.log(`   Max connections: ${info.max_connections || 'default'}`);
      
      if (info.pending_update_count > 0) {
        console.log(`\n⚠️  ${info.pending_update_count} pending updates will be delivered shortly`);
      }
      
      console.log('\n✨ Setup complete! Your bot is ready to receive messages.');
      console.log('💡 Test it by sending /start to your bot on Telegram');
    }

  } catch (error) {
    console.error('❌ Error setting webhook:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupWebhook().catch(console.error);
}

export default setupWebhook;
