import { DatabaseService } from './database.service';
import { v7 as uuidv7 } from 'uuid';

export async function seedDatabase(db: DatabaseService) {
  const userId = '018f0000-0000-7000-8000-000000000001';
  const workAccId = '018f0000-0000-7000-8000-000000000010';
  const personalAccId = '018f0000-0000-7000-8000-000000000020';
  const deviceId = '018f0000-0000-7000-8000-000000000030';

  console.log('[SEED] Seeding fictional data for Inbox Companion...');

  await db.transaction(async (client) => {
    // 1. Insert User
    await client.query(
      `INSERT INTO users (id, email, display_name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING;`,
      [userId, 'alex.morgan@example.com', 'Alex Morgan', 'https://avatar.example.com/alex.png'],
    );

    // 2. Insert Device
    await client.query(
      `INSERT INTO devices (id, user_id, device_name, platform, app_version)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING;`,
      [deviceId, userId, "Alex's Pixel 9 Pro", 'android', '1.0.0'],
    );

    // 3. Insert Connected Accounts
    await client.query(
      `INSERT INTO connected_accounts (id, user_id, provider, external_id, email, display_name, scopes, status)
       VALUES 
       ($1, $2, 'google', 'ext_google_work_01', 'alex.work@example.com', 'Alex Morgan (Work)', '["mail.read", "mail.send"]'::jsonb, 'active'),
       ($3, $2, 'microsoft', 'ext_ms_personal_02', 'alex.personal@example.com', 'Alex Morgan (Personal)', '["mail.read"]'::jsonb, 'active')
       ON CONFLICT (id) DO NOTHING;`,
      [workAccId, userId, personalAccId],
    );

    // 4. Insert Labels
    const workLabelId = uuidv7();
    const urgentLabelId = uuidv7();
    await client.query(
      `INSERT INTO labels (id, user_id, account_id, name, color_hex)
       VALUES 
       ($1, $2, $3, 'Work', '#3B82F6'),
       ($4, $2, $3, 'Urgent', '#EF4444')
       ON CONFLICT DO NOTHING;`,
      [workLabelId, userId, workAccId, urgentLabelId],
    );

    // 5. Insert Threads
    const thread1 = '018f0000-0000-7000-8000-000000000101';
    const thread2 = '018f0000-0000-7000-8000-000000000102';

    await client.query(
      `INSERT INTO threads (id, user_id, account_id, subject, snippet, is_unread, is_starred, folder, has_attachments, message_count, last_message_at)
       VALUES 
       ($1, $2, $3, 'Q3 Product Strategy & Roadmap', 'Team, please review the attached slide deck before our Thursday alignment meeting.', false, true, 'inbox', true, 3, clock_timestamp() - interval '2 hours'),
       ($4, $2, $5, 'Weekend Hiking & Camping Trip Details', 'Hey Alex, we are finalizing the campsite reservations for Mount Rainier!', true, false, 'inbox', false, 1, clock_timestamp() - interval '5 hours')
       ON CONFLICT (id) DO NOTHING;`,
      [thread1, userId, workAccId, thread2, personalAccId],
    );

    // 6. Insert Messages & Message Bodies
    const msg1 = uuidv7();
    await client.query(
      `INSERT INTO messages (id, user_id, thread_id, account_id, sender_name, sender_email, to_recipients, is_unread, sent_at)
       VALUES ($1, $2, $3, $4, 'Sarah Chen', 'sarah.chen@example.com', '[{"name":"Alex Morgan","email":"alex.work@example.com"}]'::jsonb, false, clock_timestamp() - interval '2 hours')
       ON CONFLICT (id) DO NOTHING;`,
      [msg1, userId, thread1, workAccId],
    );

    await client.query(
      `INSERT INTO message_bodies (message_id, user_id, body_plain, body_html, snippet)
       VALUES ($1, $2, 'Team, please review the attached slide deck before our Thursday alignment meeting. Looking forward to feedback.', '<p>Team, please review the attached slide deck before our Thursday alignment meeting.</p>', 'Team, please review the attached slide deck...')
       ON CONFLICT (message_id) DO NOTHING;`,
      [msg1, userId],
    );

    // 7. Insert Attachment
    await client.query(
      `INSERT INTO attachments (id, message_id, user_id, filename, content_type, size_bytes, storage_path)
       VALUES ($1, $2, $3, 'Q3_Product_Roadmap.pdf', 'application/pdf', 2450000, '/storage/attachments/q3_roadmap.pdf')
       ON CONFLICT (id) DO NOTHING;`,
      [uuidv7(), msg1, userId],
    );

    // 8. Insert Tasks
    await client.query(
      `INSERT INTO tasks (id, user_id, thread_id, title, due_date, is_completed)
       VALUES ($1, $2, $3, 'Review Q3 Product Deck slides 14-22', clock_timestamp() + interval '2 days', false)
       ON CONFLICT (id) DO NOTHING;`,
      [uuidv7(), userId, thread1],
    );

    // 9. Insert Calendar Event
    await client.query(
      `INSERT INTO calendar_events (id, user_id, account_id, title, description, start_time, end_time, join_url, attendees)
       VALUES ($1, $2, $3, 'Q3 Product Strategy Alignment', 'Roadmap walkthrough with core stakeholders', clock_timestamp() + interval '1 day', clock_timestamp() + interval '1 day 1 hour', 'https://meet.example.com/q3-strategy', '[{"name":"Sarah Chen","email":"sarah@example.com"}]'::jsonb)
       ON CONFLICT (id) DO NOTHING;`,
      [uuidv7(), userId, workAccId],
    );

    console.log('[SEED] Fictional seed data created successfully.');
  }, userId);
}

async function run() {
  const db = new DatabaseService();
  db.onModuleInit();
  try {
    await seedDatabase(db);
  } catch (err: any) {
    console.error('[SEED_ERROR]', err.message);
    process.exit(1);
  } finally {
    await db.onModuleDestroy();
  }
}

if (require.main === module) {
  run();
}
