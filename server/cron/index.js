/**
 * Cron Jobs — scheduled data sync tasks
 *
 * Schedule (UTC):
 *   02:00 daily  — Gallery (NanoBanana)
 *   02:30 daily  — Seedance (GitHub)
 *   03:00 daily  — Seedance (YouMind CSV)
 *   05:00 Sunday — Link health check
 *
 * Sref crawl is NOT scheduled — Admin-only manual trigger.
 */

const cron = require('node-cron');
const { runSync } = require('../services/dataSyncService');

function startCronJobs() {
  // NanoBanana: daily 02:00 UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('[cron] Starting NanoBanana sync...');
    try {
      await runSync('nanobanana');
    } catch (err) {
      console.error('[cron] NanoBanana error:', err.message);
    }
  }, { timezone: 'UTC' });

  // Seedance GitHub: daily 02:30 UTC
  cron.schedule('30 2 * * *', async () => {
    console.log('[cron] Starting Seedance GitHub sync...');
    try {
      await runSync('seedance-github');
    } catch (err) {
      console.error('[cron] Seedance GitHub error:', err.message);
    }
  }, { timezone: 'UTC' });

  // Seedance YouMind: daily 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    console.log('[cron] Starting Seedance YouMind sync...');
    try {
      await runSync('seedance-youmind');
    } catch (err) {
      console.error('[cron] Seedance YouMind error:', err.message);
    }
  }, { timezone: 'UTC' });

  // GitHub Trending Prompts: every Monday 03:30 UTC
  cron.schedule('30 3 * * 1', async () => {
    console.log('[cron] Starting GitHub Trending sync...');
    try {
      await runSync('github-trending');
    } catch (err) {
      console.error('[cron] GitHub Trending error:', err.message);
    }
  }, { timezone: 'UTC' });

  // Link health check: Sunday 05:00 UTC
  cron.schedule('0 5 * * 0', async () => {
    console.log('[cron] Starting link health check...');
    try {
      // Run the existing checkLinkHealth script as child process
      const { execFile } = require('child_process');
      const path = require('path');
      const scriptPath = path.join(__dirname, '../scripts/checkLinkHealth.js');
      execFile('node', [scriptPath], { timeout: 30 * 60 * 1000 }, (err, stdout, stderr) => {
        if (err) console.error('[cron] link-health error:', err.message);
        else console.log('[cron] link-health done:', stdout.substring(0, 300));
      });
    } catch (err) {
      console.error('[cron] link-health error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('[cron] Scheduled jobs: NanoBanana@02:00 | Seedance-GH@02:30 | Seedance-YM@03:00 | GH-Trending@Mon03:30 | LinkHealth@Sun05:00 (UTC)');
}

module.exports = { startCronJobs };
