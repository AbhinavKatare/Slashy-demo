import 'package:html/parser.dart' as html_parser;

class SanitizedEmailResult {
  const SanitizedEmailResult({
    required this.cleanedHtml,
    required this.hasBlockedImages,
    required this.blockedImageCount,
    this.quotedHtml,
  });

  final String cleanedHtml;
  final bool hasBlockedImages;
  final int blockedImageCount;
  final String? quotedHtml;
}

class HtmlEmailSanitizer {
  static const Set<String> _forbiddenTags = {
    'script',
    'noscript',
    'iframe',
    'frame',
    'frameset',
    'object',
    'embed',
    'applet',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'option',
    'meta',
    'link',
    'base',
  };

  static const List<String> _disallowedUrlPrefixes = [
    'javascript:',
    'vbscript:',
    'data:text/html',
  ];

  /// Sanitizes HTML email body, blocks remote tracking pixels/images unless allowed,
  /// collapses quoted reply history, and ensures safe link hrefs.
  static SanitizedEmailResult sanitize({
    required String rawHtml,
    bool allowRemoteImages = false,
    bool isDarkMode = false,
  }) {
    if (rawHtml.trim().isEmpty) {
      return const SanitizedEmailResult(
        cleanedHtml: '',
        hasBlockedImages: false,
        blockedImageCount: 0,
      );
    }

    final document = html_parser.parse(rawHtml);
    int blockedImages = 0;
    String? extractedQuotedHtml;

    // 1. Remove dangerous blacklisted elements
    for (final tag in _forbiddenTags) {
      document.querySelectorAll(tag).forEach((element) => element.remove());
    }

    // 2. Identify and extract quoted text history
    final quoteElements = document.querySelectorAll(
      'blockquote, .gmail_quote, .yahoo_quoted, [class*="quote"]',
    );
    if (quoteElements.isNotEmpty) {
      final quote = quoteElements.first;
      extractedQuotedHtml = quote.outerHtml;
      quote.remove();
    }

    // 3. Inspect and sanitize all elements & attributes
    final allElements = document.querySelectorAll('*');
    for (final el in allElements) {
      // Remove inline event handlers (onclick, onload, onerror, etc.)
      final attrsToRemove = <Object>[];
      el.attributes.forEach((key, val) {
        final attrName = key.toString().toLowerCase();
        if (attrName.startsWith('on')) {
          attrsToRemove.add(key);
        }
      });
      for (final a in attrsToRemove) {
        el.attributes.remove(a);
      }

      // Sanitize <a> links
      if (el.localName == 'a') {
        final href = (el.attributes['href'] ?? '').trim().toLowerCase();
        for (final dangerous in _disallowedUrlPrefixes) {
          if (href.startsWith(dangerous)) {
            el.attributes.remove('href');
            break;
          }
        }
      }

      // Sanitize <img> tags
      if (el.localName == 'img') {
        final src = (el.attributes['src'] ?? '').trim();
        final width = int.tryParse(el.attributes['width'] ?? '') ?? 100;
        final height = int.tryParse(el.attributes['height'] ?? '') ?? 100;

        // Strip 1x1 tracking beacons completely
        final isTrackingPixel =
            (width <= 1 && height <= 1) || src.contains('tracker.pixel');
        if (isTrackingPixel) {
          el.remove();
          continue;
        }

        // Handle remote image blocking
        final isRemote =
            src.startsWith('http://') || src.startsWith('https://');
        if (isRemote && !allowRemoteImages) {
          blockedImages++;
          el.attributes['data-original-src'] = src;
          el.attributes['src'] = '';
          el.attributes['alt'] = '[Remote image blocked for privacy]';
        }
      }

      // Dark mode adaptation
      if (isDarkMode && el.attributes.containsKey('style')) {
        final style = el.attributes['style'] ?? '';
        // Strip hardcoded dark background and black text conflicts
        if (style.contains('color: #000') ||
            style.contains('color: black') ||
            style.contains('background-color: #fff') ||
            style.contains('background-color: white')) {
          el.attributes.remove('style');
        }
      }
    }

    final body = document.body;
    final cleaned = body?.innerHtml ?? '';

    return SanitizedEmailResult(
      cleanedHtml: cleaned,
      hasBlockedImages: blockedImages > 0,
      blockedImageCount: blockedImages,
      quotedHtml: extractedQuotedHtml,
    );
  }

  /// Determines if a URL is suspicious (e.g. IP address hostname, deceptive scheme)
  static bool isSuspiciousUrl(String url) {
    try {
      final uri = Uri.parse(url);
      if (uri.scheme != 'http' && uri.scheme != 'https') {
        return true;
      }
      final host = uri.host;
      // Host is raw IP address
      if (RegExp(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$').hasMatch(host)) {
        return true;
      }
      // Extremely long host or punycode xn--
      if (host.startsWith('xn--') || host.contains('@')) {
        return true;
      }
      return false;
    } catch (_) {
      return true;
    }
  }
}
