import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/html/html_email_sanitizer.dart';

void main() {
  group('HtmlEmailSanitizer Corpus Security Tests', () {
    test('Strips executable <script> tags completely', () {
      const rawHtml =
          '<p>Hello world</p><script>alert("XSS")</script><p>Bye</p>';
      final result = HtmlEmailSanitizer.sanitize(rawHtml: rawHtml);

      expect(result.cleanedHtml.contains('<script>'), isFalse);
      expect(result.cleanedHtml.contains('alert'), isFalse);
      expect(result.cleanedHtml.contains('Hello world'), isTrue);
    });

    test(
      'Strips event handler attributes (onerror, onclick, onload, etc.)',
      () {
        const rawHtml =
            '<img src="https://example.com/pic.png" onerror="alert(1)" onclick="steal()">'
            '<button onmouseover="bad()">Click</button>';
        final result = HtmlEmailSanitizer.sanitize(rawHtml: rawHtml);

        expect(result.cleanedHtml.contains('onerror'), isFalse);
        expect(result.cleanedHtml.contains('onclick'), isFalse);
        expect(result.cleanedHtml.contains('onmouseover'), isFalse);
        expect(
          result.cleanedHtml.contains('<button>'),
          isFalse,
        ); // button tag stripped
      },
    );

    test('Strips javascript: and vbscript: links from <a> tags', () {
      const rawHtml =
          '<a href="javascript:stealTokens()">Legitimate Link</a>'
          '<a href="vbscript:msgbox()">Another Link</a>'
          '<a href="https://example.com/safe">Safe Link</a>';
      final result = HtmlEmailSanitizer.sanitize(rawHtml: rawHtml);

      expect(result.cleanedHtml.contains('javascript:'), isFalse);
      expect(result.cleanedHtml.contains('vbscript:'), isFalse);
      expect(result.cleanedHtml.contains('https://example.com/safe'), isTrue);
    });

    test('Strips 1x1 tracking beacon pixels completely', () {
      const rawHtml =
          '<p>Email message</p>'
          '<img src="https://analytics.tracker.pixel/open.gif" width="1" height="1">'
          '<p>End of message</p>';
      final result = HtmlEmailSanitizer.sanitize(rawHtml: rawHtml);

      expect(result.cleanedHtml.contains('tracker.pixel'), isFalse);
      expect(result.cleanedHtml.contains('open.gif'), isFalse);
    });

    test('Blocks remote images by default and counts blocked images', () {
      const rawHtml =
          '<p>Photo</p><img src="https://images.example.com/photo.jpg" width="400" height="300">';
      final result = HtmlEmailSanitizer.sanitize(
        rawHtml: rawHtml,
        allowRemoteImages: false,
      );

      expect(result.hasBlockedImages, isTrue);
      expect(result.blockedImageCount, equals(1));
      expect(
        result.cleanedHtml.contains(
          'data-original-src="https://images.example.com/photo.jpg"',
        ),
        isTrue,
      );
      expect(result.cleanedHtml.contains('src=""'), isTrue);
    });

    test('Allows remote images when user explicitly permits', () {
      const rawHtml =
          '<p>Photo</p><img src="https://images.example.com/photo.jpg" width="400" height="300">';
      final result = HtmlEmailSanitizer.sanitize(
        rawHtml: rawHtml,
        allowRemoteImages: true,
      );

      expect(result.hasBlockedImages, isFalse);
      expect(
        result.cleanedHtml.contains(
          'src="https://images.example.com/photo.jpg"',
        ),
        isTrue,
      );
    });

    test('Extracts and collapses quoted reply history', () {
      const rawHtml =
          '<p>Sounds good, see you tomorrow!</p>'
          '<div class="gmail_quote">On Oct 12, Jane Doe wrote:<blockquote>Let us meet at 10 AM.</blockquote></div>';
      final result = HtmlEmailSanitizer.sanitize(rawHtml: rawHtml);

      expect(result.cleanedHtml.contains('Sounds good'), isTrue);
      expect(
        result.cleanedHtml.contains('gmail_quote'),
        isFalse,
      ); // extracted from main body
      expect(result.quotedHtml != null, isTrue);
      expect(result.quotedHtml!.contains('Jane Doe wrote'), isTrue);
    });

    test('Identifies suspicious URLs correctly', () {
      expect(
        HtmlEmailSanitizer.isSuspiciousUrl('https://192.168.1.1/login'),
        isTrue,
      ); // raw IP
      expect(
        HtmlEmailSanitizer.isSuspiciousUrl('https://xn--pple-43d.com'),
        isTrue,
      ); // punycode
      expect(HtmlEmailSanitizer.isSuspiciousUrl('javascript:alert(1)'), isTrue);
      expect(
        HtmlEmailSanitizer.isSuspiciousUrl('https://mail.google.com/mail'),
        isFalse,
      );
      expect(
        HtmlEmailSanitizer.isSuspiciousUrl(
          'https://github.com/flutter/flutter',
        ),
        isFalse,
      );
    });
  });
}
