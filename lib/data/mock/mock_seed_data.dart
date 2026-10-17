/// Fictional seed data for development, testing, and local mock server.
/// Adheres strictly to standing rules: No secrets, no real PII, only fictional entities.
class MockSeedData {
  static const Map<String, dynamic> currentUser = {
    'id': 'usr_alex_01',
    'email': 'alex.morgan@acme-companion.test',
    'displayName': 'Alex Morgan',
    'avatarUrl': null,
  };

  static const Map<String, dynamic> authTokens = {
    'accessToken': 'mock_access_jwt_header.payload.signature_xyz123',
    'refreshToken': 'mock_refresh_jwt_header.payload.signature_abc987',
    'tokenType': 'Bearer',
    'expiresIn': 3600,
    'user': currentUser,
  };

  static const List<Map<String, dynamic>> accounts = [
    {
      'id': 'acc_work_01',
      'email': 'alex.work@acme-companion.test',
      'provider': 'google',
      'isPrimary': true,
      'syncStatus': 'synced',
      'unreadCount': 4,
    },
    {
      'id': 'acc_personal_02',
      'email': 'alex.personal@companion-mail.test',
      'provider': 'imap',
      'isPrimary': false,
      'syncStatus': 'synced',
      'unreadCount': 1,
    },
  ];

  static const List<Map<String, dynamic>> labels = [
    {
      'id': 'lbl_design',
      'name': 'Design System',
      'colorHex': '#6366F1',
      'isSystem': false,
      'unreadCount': 2,
      'totalCount': 8,
    },
    {
      'id': 'lbl_urgent',
      'name': 'Urgent Action',
      'colorHex': '#EF4444',
      'isSystem': true,
      'unreadCount': 1,
      'totalCount': 3,
    },
    {
      'id': 'lbl_roadmap',
      'name': 'Roadmap & Specs',
      'colorHex': '#10B981',
      'isSystem': false,
      'unreadCount': 1,
      'totalCount': 12,
    },
    {
      'id': 'lbl_clients',
      'name': 'Client Reviews',
      'colorHex': '#F59E0B',
      'isSystem': false,
      'unreadCount': 0,
      'totalCount': 5,
    },
  ];

  static const List<Map<String, dynamic>> threads = [
    {
      'id': 'th_101',
      'accountId': 'acc_work_01',
      'subject':
          'Architecture Review: Multi-platform Design Tokens & Motion Specs',
      'snippet': 'The proposed M3 color scheme and typography hierarchy look great. Let us finalize the touch target constraints before Wednesday.',
      'lastMessageAt': '2026-10-12T14:35:00Z',
      'isUnread': true,
      'isStarred': true,
      'messageCount': 4,
      'folder': 'inbox',
      'hasAttachments': true,
      'labelIds': ['lbl_design', 'lbl_urgent'],
      'participants': [
        {
          'name': 'Jordan Lee',
          'email': 'jordan.lee@acme-companion.test',
          'avatarUrl': null,
        },
        {
          'name': 'Dr. Priya Sharma',
          'email': 'priya.sharma@research-labs.test',
          'avatarUrl': null,
        },
        {
          'name': 'Alex Morgan',
          'email': 'alex.morgan@acme-companion.test',
          'avatarUrl': null,
        },
      ],
    },
    {
      'id': 'th_102',
      'accountId': 'acc_work_01',
      'subject':
          'Sprint 42 Deliverables: Offline Queue & Idempotency Key Audits',
      'snippet': 'All idempotent writes are now attaching UUID v4 headers. Tested retry with jitter backoff on unstable network connections.',
      'lastMessageAt': '2026-10-12T11:20:00Z',
      'isUnread': false,
      'isStarred': false,
      'messageCount': 2,
      'folder': 'inbox',
      'hasAttachments': false,
      'labelIds': ['lbl_roadmap'],
      'participants': [
        {
          'name': 'Samira Khan',
          'email': 'samira@orbital-systems.test',
          'avatarUrl': null,
        },
        {
          'name': 'Alex Morgan',
          'email': 'alex.morgan@acme-companion.test',
          'avatarUrl': null,
        },
      ],
    },
    {
      'id': 'th_103',
      'accountId': 'acc_work_01',
      'subject': 'Quarterly Compliance & PII Sanitization Certification',
      'snippet': 'Please review the updated logging interceptor. Notice how emails and bearer tokens are automatically scrubbed prior to console output.',
      'lastMessageAt': '2026-10-11T16:45:00Z',
      'isUnread': false,
      'isStarred': true,
      'messageCount': 3,
      'folder': 'starred',
      'hasAttachments': true,
      'labelIds': ['lbl_urgent'],
      'participants': [
        {
          'name': 'Marcus Vance',
          'email': 'marcus@vance-legal.test',
          'avatarUrl': null,
        },
        {
          'name': 'Alex Morgan',
          'email': 'alex.morgan@acme-companion.test',
          'avatarUrl': null,
        },
      ],
    },
  ];

  static const List<Map<String, dynamic>> messages = [
    {
      'id': 'msg_201',
      'threadId': 'th_101',
      'sender': {
        'name': 'Jordan Lee',
        'email': 'jordan.lee@acme-companion.test',
        'avatarUrl': null,
      },
      'recipients': [
        {
          'name': 'Alex Morgan',
          'email': 'alex.morgan@acme-companion.test',
          'avatarUrl': null,
        },
        {
          'name': 'Dr. Priya Sharma',
          'email': 'priya.sharma@research-labs.test',
          'avatarUrl': null,
        },
      ],
      'cc': <Map<String, dynamic>>[],
      'bcc': <Map<String, dynamic>>[],
      'subject':
          'Architecture Review: Multi-platform Design Tokens & Motion Specs',
      'bodyText': 'Hi Alex, I put together the design tokens draft with high-contrast accessibility support. Looking forward to your thoughts!',
      'bodyHtml': '<p>Hi Alex,<br>I put together the design tokens draft with high-contrast accessibility support. Looking forward to your thoughts!</p>',
      'sentAt': '2026-10-12T14:35:00Z',
      'isDraft': false,
      'attachments': [
        {
          'id': 'att_01',
          'filename': 'tokens-spec-v1.pdf',
          'mimeType': 'application/pdf',
          'sizeBytes': 142050,
          'downloadUrl': 'https://mock.download.local/att_01',
        },
      ],
    },
  ];

  static const List<Map<String, dynamic>> drafts = [
    {
      'id': 'drf_01',
      'threadId': 'th_101',
      'subject': 'Re: Architecture Review: Multi-platform Design Tokens & Motion Specs',
      'bodyText': 'Hi Jordan, reviewing the tokens now. Elevation 2 and 4 look great on dark mode.',
      'updatedAt': '2026-10-12T15:00:00Z',
      'recipients': [
        {
          'name': 'Jordan Lee',
          'email': 'jordan.lee@acme-companion.test',
          'avatarUrl': null,
        },
      ],
    },
  ];

  static const List<Map<String, dynamic>> reminders = [
    {
      'id': 'rem_01',
      'threadId': 'th_101',
      'title': 'Follow up with Jordan regarding token elevation specs',
      'dueAt': '2026-10-13T09:00:00Z',
      'isCompleted': false,
    },
  ];

  static const List<Map<String, dynamic>> scheduledSends = [
    {
      'id': 'sch_01',
      'threadId': 'th_102',
      'scheduledFor': '2026-10-13T08:00:00Z',
      'status': 'pending',
    },
  ];

  static const List<Map<String, dynamic>> calendarEvents = [
    {
      'id': 'evt_01',
      'title': 'Design System & Component Gallery Walkthrough',
      'startAt': '2026-10-13T14:00:00Z',
      'endAt': '2026-10-13T15:00:00Z',
      'isAllDay': false,
      'location': 'Virtual Conf Room Alpha',
      'meetingUrl': 'https://meet.companion.test/ds-review',
    },
    {
      'id': 'evt_02',
      'title': 'Sprint 42 Planning & Architecture Alignment',
      'startAt': '2026-10-14T10:00:00Z',
      'endAt': '2026-10-14T11:00:00Z',
      'isAllDay': false,
      'location': 'Main Conference Room B',
      'meetingUrl': null,
    },
  ];

  static const List<Map<String, dynamic>> tasks = [
    {
      'id': 'tsk_01',
      'title': 'Verify 48dp minimum touch target bounding boxes on mobile',
      'threadId': 'th_101',
      'dueAt': '2026-10-13T18:00:00Z',
      'isCompleted': false,
      'priority': 'high',
    },
    {
      'id': 'tsk_02',
      'title': 'Validate 200% text scale accessibility tests without layout overflow',
      'threadId': 'th_101',
      'dueAt': '2026-10-14T12:00:00Z',
      'isCompleted': false,
      'priority': 'urgent',
    },
    {
      'id': 'tsk_03',
      'title': 'Follow up with Priya on Q4 roadmap milestones',
      'threadId': 'th_102',
      'dueAt': '2026-10-15T10:00:00Z',
      'isCompleted': false,
      'priority': 'medium',
    },
    {
      'id': 'tsk_04',
      'title': 'Review and merge design-tokens PR before sprint freeze',
      'threadId': null,
      'dueAt': '2026-10-16T17:00:00Z',
      'isCompleted': true,
      'priority': 'high',
    },
    {
      'id': 'tsk_05',
      'title': 'Schedule biweekly sync with Jordan re: Motion Spec finalization',
      'threadId': 'th_103',
      'dueAt': '2026-10-18T09:00:00Z',
      'isCompleted': false,
      'priority': 'medium',
    },
  ];

  static const Map<String, dynamic> aiDraftReply = {
    'draftSubject':
        'Re: Architecture Review: Multi-platform Design Tokens & Motion Specs',
    'draftBody': 'Hi Jordan,\n\nThanks for sharing the updated design tokens. The contrast ratios in both light and dark modes meet WCAG AAA standards. I have confirmed the 48dp touch target requirements across buttons and chips.\n\nBest regards,\nAlex',
    'confidenceScore': 0.94,
  };

  static const Map<String, dynamic> aiSummary = {
    'overview': 'Discussion regarding multi-platform design tokens, Material 3 color schemes, and accessibility guidelines.',
    'keyTakeaways': [
      'Design tokens have been finalized for light, dark, and high-contrast modes.',
      'Touch targets must adhere strictly to 48dp minimum dimensions.',
      'Offline queue and idempotent writes verified.',
    ],
    'suggestedActions': [
      'Run widget golden tests across light and dark color schemes.',
      'Verify text scale accessibility at 200%.',
    ],
  };
}
