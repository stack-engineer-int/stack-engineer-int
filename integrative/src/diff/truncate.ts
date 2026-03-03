export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateDiff(diff: string, maxTokens: number = 30000): string {
  const maxChars = maxTokens * 4;
  if (diff.length <= maxChars) return diff;

  const truncated = diff.slice(0, maxChars);
  const lastDiffHeader = truncated.lastIndexOf('\ndiff --git');

  if (lastDiffHeader > maxChars * 0.5) {
    return truncated.slice(0, lastDiffHeader) + '\n\n... [diff truncated for length]';
  }

  return truncated + '\n\n... [diff truncated for length]';
}
