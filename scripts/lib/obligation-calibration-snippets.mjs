/**
 * Pass/fail snippets aligned with planning-sim-core evaluateCompare.
 */
export function passSnippetForObligation(ob) {
  const t = ob.detect?.type ?? 'pattern';
  const d = ob.detect ?? {};
  if (t === 'route_link') return `<a href="${d.hrefContains ?? 'privacy'}">ok</a>`;
  if (t === 'route_exists' || t === 'required_route') {
    return `export default function P(){return <main>${d.path ?? '/terms'}</main>}`;
  }
  if (t === 'schema_table') return `CREATE TABLE ${d.table ?? 'consent_audit_log'} (id INT)`;
  if (t === 'schema_column') {
    return `ALTER TABLE ${d.table ?? 'users'} ADD ${d.column ?? 'terms_accepted_at'} TEXT`;
  }
  if (t === 'config') return `${d.field ?? d.key ?? 'verifiedDomain'} webhooks deliveryEvents`;
  if (t === 'header') return `${d.name ?? d.header ?? 'List-Unsubscribe'}: ok`;
  if (t === 'manual') return 'manualReviewCompleted=true';
  if (t === 'pattern') return (d.patterns ?? ['unsubscribe']).join(' ');
  if (t === 'ui_pattern') return `/* ${d.pattern ?? 'cancel subscription'} */`;
  if (t === 'flow_ref') {
    return `flowId:${d.flowId ?? d.flow ?? 'delete-account'} delete-account data-export`;
  }
  if (t === 'template_scan') {
    if (d.field === 'promotionalContentInTransactional') return 'transactional receipt only';
    if (d.event) return `invoice.payment_failed template txn_ok physicalAddress`;
    if (d.templateIdPrefix) return `templateId=${d.templateIdPrefix}welcome`;
    if (d.forbidden) return 'physicalAddress 123 Main St';
    if (d.field === 'preheader') return 'preheader: honest summary';
    return 'physicalAddress 123 Main St';
  }
  if (t === 'script_before_consent') return 'CookieConsent before analytics';
  if (t === 'component_scan') return (d.patterns ?? ['cookie', 'consent']).join(' ');
  if (t === 'verified_sender_domain') return 'verifiedDomain mail.example.com resend';
  if (t === 'required_attribute') {
    if (d.selector === 'img' || d.attr === 'alt') return `<img ${d.attr ?? 'alt'}="x" src="/a.png" />`;
    if (d.selector === 'html' && d.attr === 'lang') return '<html lang="en">';
    if (d.attr === 'aria-label') return '<button aria-label="close">X</button>';
    return `<button ${d.attr ?? 'aria-label'}="x">X</button>`;
  }
  if (t === 'label_association') {
    return '<label htmlFor="email">Email</label><input id="email" />';
  }
  if (t === 'required_copy') {
    return String(d.phrase ?? d.text ?? 'required copy present');
  }
  return `pass ${ob.id}`;
}

export function failSnippetForObligation(ob) {
  const t = ob.detect?.type ?? 'pattern';
  const d = ob.detect ?? {};
  if (t === 'manual') return 'not reviewed yet';
  if (t === 'ui_pattern') return 'defaultChecked={true}';
  if (t === 'script_before_consent') return 'analytics.load() without consent';
  if (t === 'route_link') return '<form></form>';
  if (t === 'route_exists' || t === 'required_route') return 'export default function P(){return null}';
  if (t === 'template_scan') {
    if (d.field === 'promotionalContentInTransactional') return 'buy now limited offer sale today';
    if (d.forbidden?.length) return String(d.forbidden[0]);
    if (d.templateIdPrefix) return 'marketing_newsletter_v1';
    return 'empty template';
  }
  if (t === 'component_scan') return 'no banner here';
  if (t === 'flow_ref') return 'unrelated flow';
  if (t === 'pattern' && d.forbidden) return String(d.forbidden[0]);
  if (t === 'header') return 'From: noreply@example.com';
  if (t === 'schema_table' || t === 'schema_column') return `gap ${ob.id}`;
  if (t === 'config' || t === 'verified_sender_domain') return `gap ${ob.id}`;
  if (t === 'required_attribute') {
    if (d.selector === 'img') return '<img src="/a.png" />';
    if (d.selector === 'html') return '<html>';
    return '<button>X</button>';
  }
  if (t === 'label_association') return '<input name="email" />';
  if (t === 'pattern') return 'lorem ipsum no patterns';
  return `gap ${ob.id}`;
}
