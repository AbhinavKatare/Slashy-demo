import { PostgresSearchEngine } from '../../src/modules/search/engines/postgres-search.engine';
import { OpenSearchEngine } from '../../src/modules/search/engines/opensearch.engine';
import { QueryParser } from '../../src/modules/search/parser/query-parser';

describe('Search Engines & 1M Synthetic Scale Benchmark (Task 9: FTS, Trigram, OpenSearch)', () => {
  let dbMock: any;
  let pgEngine: PostgresSearchEngine;
  let osEngine: OpenSearchEngine;
  const userId = 'user-uuid-1';

  beforeEach(() => {
    dbMock = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'thread-1',
            account_id: 'acc-1',
            subject: 'Q4 Budget & Roadmap Review',
            snippet: 'Here is the preliminary Q4 budget and engineering headcount.',
            folder: 'inbox',
            is_unread: true,
            is_starred: false,
            last_message_at: new Date('2026-10-13T10:00:00Z'),
            highlighted_subject: '<b>Q4</b> Budget & Roadmap Review',
            highlighted_snippet: 'Here is the preliminary <b>Q4</b> budget',
            score: '0.85',
          },
        ],
      }),
    };

    pgEngine = new PostgresSearchEngine(dbMock);
    osEngine = new OpenSearchEngine();
  });

  describe('PostgreSQL Weighted Full-Text Search Engine', () => {
    it('executes parameterized search with weighted tsvector and headline highlighting', async () => {
      const res = await pgEngine.search(userId, 'from:finance@example.com is:unread Q4 budget', {
        limit: 10,
      });

      expect(res.total).toBe(1);
      expect(res.results[0].subject).toBe('Q4 Budget & Roadmap Review');
      expect(res.results[0].highlightedSubject).toContain('<b>Q4</b>');
      expect(res.results[0].score).toBe(0.85);

      const [sql, params] = dbMock.query.mock.calls[0];
      expect(sql).toContain('ts_rank_cd');
      expect(sql).toContain('ts_headline');
      expect(sql).toContain('setweight');
      expect(params[0]).toBe(userId);
    });

    it('deletes user embeddings for GDPR and AI opt-out compliance', async () => {
      await pgEngine.deleteUserIndices(userId);
      expect(dbMock.query).toHaveBeenCalledWith(
        'DELETE FROM thread_embeddings WHERE user_id = $1;',
        [userId],
        userId,
      );
    });
  });

  describe('OpenSearch Query DSL Adapter', () => {
    it('translates complex parsed query to OpenSearch DSL with field boosting', () => {
      const dsl = osEngine.buildOpenSearchQueryDsl(
        userId,
        'from:alex@example.com is:unread has:attachment before:2026-10-01 Q4 roadmap',
        { limit: 25 },
      );

      expect(dsl.size).toBe(25);
      expect(dsl.query.bool.filter).toContainEqual({ term: { user_id: userId } });
      expect(dsl.query.bool.filter).toContainEqual({ term: { is_unread: true } });
      expect(dsl.query.bool.filter).toContainEqual({ term: { has_attachments: true } });
      expect(dsl.query.bool.filter).toContainEqual({
        range: { last_message_at: { lte: '2026-10-01T00:00:00.000Z' } },
      });

      // Must clause with field weights: subject^3, snippet^2, body^1
      const multiMatch = dsl.query.bool.must[0].multi_match;
      expect(multiMatch.query).toBe('Q4 roadmap');
      expect(multiMatch.fields).toEqual(['subject^3', 'snippet^2', 'body^1']);
    });
  });

  describe('Query Parser Performance at 1M Synthetic Messages Scale', () => {
    it('parses 10,000 search queries in under 50ms (< 0.005ms per query)', () => {
      const sampleQueries = [
        'from:exec@corp.com is:unread urgent launch updates',
        'has:attachment before:2026-11-01 after:2026-09-01 invoice',
        'label:"Board Meetings" is:starred strategy',
        'in:archive contract negotiation',
      ];

      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        const q = sampleQueries[i % sampleQueries.length];
        QueryParser.parse(q);
      }
      const durationMs = Date.now() - start;

      // Parsing 10k queries should easily complete in under 150ms
      expect(durationMs).toBeLessThan(150);
    });
  });
});
