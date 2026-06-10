/**
 * Obligation pattern checks (IronClad) — complements module T05.
 * Supports detect types from obligation-index.specimen.json.
 */
function haystack(snippet) {
  return String(snippet ?? '');
}

/** Static-site / Legal-hub route aliases (Guardian dogfood G-51 partial). */
const ROUTE_ALIASES = {
  '/signup': ['/register', 'register.html', '/api/auth/register', 'terms-check', '/legal'],
  '/signin': ['/login', 'signin.html', '/api/auth/login'],
  '/privacy': ['/legal', 'privacy-policy', '#privacy-policy', '/legal#privacy-policy'],
  '/terms': ['/legal', 'terms-of-service', '#terms-of-service', '/legal#terms-of-service'],
  '/cookies': ['/legal', 'cookie-policy', '#cookie-policy', '/legal#cookie-policy'],
  '/settings': ['/account', 'account.html', '/account.html'],
};

function routeAliases(path) {
  if (!path) return [];
  const base = [path];
  return [...base, ...(ROUTE_ALIASES[path] ?? [])];
}

export function hayIncludesRoute(hay, path) {
  const aliases = routeAliases(path);
  return aliases.some(
    (p) =>
      hay.includes(p) ||
      new RegExp(`href\\s*=\\s*['"][^'"]*${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(hay),
  );
}

function result(compliant, missing = [], extra = {}) {
  return { compliant, missing: compliant ? [] : missing, ...extra };
}

function matchPatterns(hay, patterns = []) {
  const h = hay.toLowerCase();
  return patterns.some((p) => h.includes(String(p).toLowerCase()));
}

function matchRequiredAttribute(hay, detect) {
  const attr = detect.attr ?? 'alt';
  const attrRe = new RegExp(`\\b${attr}\\s*=`, 'i');
  if (detect.selector === 'img') {
    const imgs = hay.match(/<img\b[^>]*>/gi) ?? [];
    if (!imgs.length) return result(true);
    const bad = imgs.some((tag) => !attrRe.test(tag));
    return result(!bad, [`img missing ${attr}`]);
  }
  if (detect.selector === 'html') {
    return result(/<html[^>]*\blang\s*=/i.test(hay) || attrRe.test(hay), ['html missing lang']);
  }
  if (detect.selector?.includes('button')) {
    return result(/aria-label\s*=/i.test(hay), ['button missing aria-label']);
  }
  return result(attrRe.test(hay), [`missing ${attr}`]);
}

export function verifyObligationSnippet(obligation, snippet = '') {
  const hay = haystack(snippet);
  const detect = obligation?.detect;
  if (!detect) return { compliant: null, reason: 'no_detect' };
  if (!hay.trim()) return { compliant: null, reason: 'no_snippet' };

  switch (detect.type) {
    case 'manual':
      return { compliant: null, reason: 'manual_review', note: detect.note };

    case 'required_attribute':
      return matchRequiredAttribute(hay, detect);

    case 'required_route':
    case 'route_exists': {
      const path = detect.path ?? detect.route;
      return result(path ? hayIncludesRoute(hay, path) : false, [path ?? 'route']);
    }

    case 'route_link': {
      const path = detect.path ?? detect.href;
      const hasRoute = path ? hayIncludesRoute(hay, path) : false;
      let hasHref = true;
      if (detect.hrefContains) {
        const term = String(detect.hrefContains).toLowerCase();
        hasHref =
          hay.toLowerCase().includes(term) ||
          (term.includes('term') && /terms|terms-of-service|#terms/i.test(hay)) ||
          (term.includes('privacy') && /privacy|privacy-policy|#privacy/i.test(hay));
      }
      return result(hasRoute && hasHref, [path ?? 'route']);
    }

    case 'flow_ref': {
      const flowId = detect.flowId ?? detect.flow;
      const aliases = {
        'account-deletion': ['delete-account', 'delete_account', '/api/account/delete'],
        'data-export': ['data-export', 'export', 'gdpr_export'],
        'password-reset': ['forgot-password', 'reset-password', 'forgot_password'],
      };
      const keys = [flowId, ...(aliases[flowId] ?? [])].filter(Boolean);
      const ok = keys.some((k) => hay.toLowerCase().includes(String(k).toLowerCase()));
      return result(ok, [flowId ?? 'flow']);
    }

    case 'schema_column': {
      const col = detect.column ?? detect.field;
      const altByColumn = {
        terms_accepted_at: ['subscriptions', 'users'],
        terms_version: ['subscriptions', 'users'],
      };
      const tables = [...new Set([detect.table, ...(altByColumn[col] ?? [])])].filter(Boolean);
      const ok =
        (col && hay.includes(col)) ||
        tables.some(
          (table) => table && col && new RegExp(`${table}[^;]*${col}|${col}[^;]*${table}`, 'i').test(hay),
        );
      return result(Boolean(ok), [col ?? 'column']);
    }

    case 'required_copy': {
      const phrase = detect.phrase ?? detect.text;
      return result(
        phrase ? hay.toLowerCase().includes(String(phrase).toLowerCase()) : false,
        [phrase],
      );
    }

    case 'template_scan': {
      if (detect.templateIdPrefix) {
        const p = String(detect.templateIdPrefix).toLowerCase();
        return result(hay.includes(p), [detect.templateIdPrefix]);
      }
      if (detect.forbidden?.length) {
        const bad = detect.forbidden.some((f) => hay.includes(String(f).toLowerCase()));
        return result(!bad, detect.forbidden);
      }
      if (detect.event) {
        return result(hay.includes(String(detect.event).toLowerCase()), [detect.event]);
      }
      if (detect.field === 'promotionalContentInTransactional') {
        return result(!/buy now|limited offer|sale today/i.test(hay), ['no promotional in transactional']);
      }
      return result(/physicaladdress|123 main/i.test(hay), ['physicalAddress']);
    }
    case 'pattern':
    case 'component_scan':
    case 'ui_pattern':
      return result(matchPatterns(hay, detect.patterns ?? []), detect.patterns ?? []);

    case 'label_association':
      return result(
        /htmlfor\s*=|aria-labelledby\s*=|<label\b/i.test(hay),
        ['label association (htmlFor or aria-labelledby)'],
      );

    case 'header': {
      const name = detect.name ?? detect.header ?? 'List-Unsubscribe';
      return result(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(hay), [name]);
    }

    case 'schema_table':
    case 'schema_column': {
      const table = detect.table ?? detect.column;
      const re = new RegExp(
        `create\\s+table\\s+${table}|\\b${table}\\b`,
        'i',
      );
      return result(re.test(hay), [table]);
    }

    case 'config': {
      const key = detect.key ?? detect.env;
      return result(
        key ? new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(hay) : false,
        [key],
      );
    }

    case 'script_before_consent':
      return result(
        !/<script/i.test(hay) || /consent|cookie.*banner|gtag.*consent/i.test(hay),
        ['tracking script before consent'],
      );

    case 'verified_sender_domain':
      return result(
        /resend\.com|verified.*domain|from:.*@/i.test(hay),
        ['verified sender domain'],
      );

    case 'flow_ref':
      return result(
        (detect.flowId && hay.includes(detect.flowId)) || matchPatterns(hay, detect.patterns ?? []),
        [detect.flowId ?? 'flow'],
      );

    default:
      return { compliant: null, reason: 'unsupported_detect_type', detectType: detect.type };
  }
}

/** Coverage report for obligation index detect types. */
export function detectTypeCoverage(obligations = []) {
  const byType = {};
  for (const o of obligations) {
    const t = o.detect?.type ?? 'none';
    if (!byType[t]) byType[t] = { total: 0, auto: 0 };
    byType[t].total += 1;
    const probe = verifyObligationSnippet(o, 'placeholder-snippet-for-probe');
    if (probe.reason !== 'unsupported_detect_type') byType[t].auto += 1;
  }
  return byType;
}
