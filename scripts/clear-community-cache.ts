#!/usr/bin/env node
/**
 * Clear Community Posts Cache
 *
 * This script clears the cached community posts data by calling the revalidation API.
 * Run this after database migrations that affect user names or post data.
 *
 * Usage: npx tsx scripts/clear-community-cache.ts
 */

import { revalidateTag } from 'next/cache'

async function clearCache() {
  try {
    console.log('🔄 Clearing community posts cache...')

    // Revalidate the community posts cache tag
    revalidateTag('community-posts', 'max')

    console.log('✅ Cache cleared successfully!')
    console.log('📝 The community page will fetch fresh data on next load.')

  } catch (error) {
    console.error('❌ Error clearing cache:', error)
    process.exit(1)
  }
}

clearCache()
