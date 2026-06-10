/** Planning SSOT — filterComposedSlice (see PLANNING_COMPOSE_TIER_REDACTION.md) */
const RANK = { pro: 1, armor: 2, ironclad: 3 };

export function filterComposedSlice(slice, tier) {
  const out = JSON.parse(JSON.stringify(slice));
  const r = RANK[tier] ?? 1;

  if (r < 2) {
    out.ruleFragments = (out.ruleFragments ?? []).filter(
      (f) => f.layer !== 'L3' && f.layer !== 'L4',
    );
    out.mapNodes = (out.mapNodes ?? []).filter((n) => n.type !== 'legal_touchpoint');
    out.referenceCards = (out.referenceCards ?? []).filter((c) => !c.refId?.startsWith('legal/'));
    if (out.outbound) {
      delete out.outbound.legalCompliance;
      delete out.outbound.obligations;
      delete out.outbound.marketBundle;
    }
  }

  if (r < 3) {
    out.ruleFragments = (out.ruleFragments ?? []).filter((f) => f.layer !== 'L4');
    out.mapNodes = (out.mapNodes ?? []).filter((n) => n.type !== 'legal_touchpoint');
    out.referenceCards = (out.referenceCards ?? []).filter((c) => !c.refId?.startsWith('legal/'));
    if (out.outbound) {
      delete out.outbound.legalCompliance;
      delete out.outbound.obligations;
      delete out.outbound.marketBundle;
    }
  }

  return out;
}
