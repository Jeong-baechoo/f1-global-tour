export function formatReplayTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const PLAYBACK_SPEED_OPTIONS = [0.5, 1, 1.5, 2, 4] as const;
