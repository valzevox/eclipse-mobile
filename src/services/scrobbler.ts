// TypeScript / src/services/scrobbler.ts / Expo React Native / Last.fm Scrobbler & Discord Presence Sync

import { TrackItem } from './innertube';

export interface ScrobblerConfig {
  lastFmUsername: string;
  lastFmApiKey: string;
  discordWebhookUrl: string;
  enabled: boolean;
}

export async function sendNowPlayingStatus(track: TrackItem, config: ScrobblerConfig): Promise<void> {
  if (!config.enabled || !track) return;

  // 1. Discord Rich Status / Webhook notification
  if (config.discordWebhookUrl && config.discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    try {
      await fetch(config.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Eclipse Now Playing',
          embeds: [
            {
              title: track.title,
              description: `by **${track.artist}** (${track.platform.toUpperCase()})`,
              color: 0xb69df8,
              thumbnail: { url: track.thumbnail },
              footer: { text: 'Eclipse Mobile' }
            }
          ]
        })
      });
    } catch (_) {}
  }
}
