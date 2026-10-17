import { AiService } from '../../src/modules/ai/ai.service';
import { MockAiProvider } from '../../src/modules/ai/providers/mock-ai.provider';
import { AnthropicAiProvider } from '../../src/modules/ai/providers/anthropic-ai.provider';

describe('AiService (Privacy-Safe Summarization & Smart Replies)', () => {
  let aiService: AiService;
  let dbMock: any;

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
    };
    aiService = new AiService(dbMock, new MockAiProvider(), new AnthropicAiProvider());
  });

  it('should summarize thread and persist ONLY metadata in ai_requests (zero body/PII)', async () => {
    const userId = 'user-uuid-1';
    const threadId = 'thread-uuid-1';

    dbMock.query
      .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // quota check
      .mockResolvedValueOnce({
        rows: [
          {
            id: threadId,
            subject: 'Q4 Product Launch Update',
            snippet: 'Team, here is the updated timeline',
            messages: [
              {
                sender: 'Taylor Swift',
                body: 'All features are ready for QA staging testing.',
                sent_at: '2026-10-13T10:00:00Z',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // INSERT into ai_requests

    const result = await aiService.summarizeThread(userId, { threadId });

    expect(result.threadId).toBe(threadId);
    expect(result.summary).toBeDefined();
    expect(result.keyPoints.length).toBeGreaterThan(0);
    expect(result.actionItems.length).toBeGreaterThan(0);

    // CRITICAL PRIVACY ASSERTION:
    // Verify that the query to insert into ai_requests does NOT contain body text or PII
    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ai_requests'),
      expect.not.arrayContaining(['All features are ready for QA staging testing.']),
      userId,
    );
  });

  it('should generate reply tailored to tone option', async () => {
    const userId = 'user-uuid-1';
    const threadId = 'thread-uuid-1';

    dbMock.query
      .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // quota check
      .mockResolvedValueOnce({
        rows: [
          {
            id: threadId,
            subject: 'Project Kickoff',
            sender_name: 'Morgan',
            sender_email: 'morgan@example.com',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await aiService.generateReply(userId, {
      threadId,
      tone: 'friendly',
      userPrompt: 'Available Friday afternoon',
    });

    expect(result.suggestedSubject).toBe('Re: Project Kickoff');
    expect(result.suggestedBody).toContain('Thanks so much for reaching out!');
    expect(result.suggestedBody).toContain('Available Friday afternoon');
  });
});
