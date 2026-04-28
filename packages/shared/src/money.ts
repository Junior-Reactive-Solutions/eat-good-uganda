export function formatUGX(amountMinor: number): string {
  return `UGX ${amountMinor.toLocaleString('en-US')}`
}
