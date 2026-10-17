import { QueryParser } from '../../src/modules/search/parser/query-parser';

describe('QueryParser (Task 9: Search Query Operators & Free-Text Parser)', () => {
  it('parses empty and whitespace queries cleanly', () => {
    expect(QueryParser.parse('')).toEqual({ freeText: '' });
    expect(QueryParser.parse('   ')).toEqual({ freeText: '' });
  });

  it('parses free-text search terms without operators', () => {
    const res = QueryParser.parse('quarterly engineering sync');
    expect(res.freeText).toBe('quarterly engineering sync');
    expect(res.from).toBeUndefined();
    expect(res.isUnread).toBeUndefined();
  });

  it('parses from: and to: operators with emails and names', () => {
    const res = QueryParser.parse('from:alex@example.com to:sarah@corp.com roadmap');
    expect(res.from).toBe('alex@example.com');
    expect(res.to).toBe('sarah@corp.com');
    expect(res.freeText).toBe('roadmap');
  });

  it('parses quoted multi-word senders', () => {
    const res = QueryParser.parse('from:"Alex Morgan" budget discussion');
    expect(res.from).toBe('Alex Morgan');
    expect(res.freeText).toBe('budget discussion');
  });

  it('parses status boolean operators: is:unread, is:read, is:starred, has:attachment', () => {
    const unread = QueryParser.parse('is:unread has:attachment invoice');
    expect(unread.isUnread).toBe(true);
    expect(unread.hasAttachment).toBe(true);
    expect(unread.freeText).toBe('invoice');

    const read = QueryParser.parse('is:read is:starred');
    expect(read.isUnread).toBe(false);
    expect(read.isStarred).toBe(true);
  });

  it('parses date boundaries: before: and after:', () => {
    const res = QueryParser.parse('before:2026-10-01 after:2026-09-01 q3 review');
    expect(res.before).toEqual(new Date('2026-10-01'));
    expect(res.after).toEqual(new Date('2026-09-01'));
    expect(res.freeText).toBe('q3 review');
  });

  it('parses label: and in: folder operators', () => {
    const res = QueryParser.parse('label:Work in:archive project launch');
    expect(res.label).toBe('Work');
    expect(res.folder).toBe('archive');
    expect(res.freeText).toBe('project launch');
  });
});
