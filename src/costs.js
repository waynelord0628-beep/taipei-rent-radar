export function monthlyCost(item) {
  if (!Number.isFinite(item.rent)) return null;
  if (Number.isFinite(item.knownMonthlyCost)) return item.knownMonthlyCost;
  return item.rent + (Number.isFinite(item.managementFee) ? item.managementFee : 0);
}

export function costUncertain(item) {
  return item.managementFee == null || item.fixedFeesStatus === '待確認' || Boolean(item.extraFee && !item.fixedFeesStatus);
}
