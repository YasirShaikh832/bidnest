import webpush from 'web-push';
import { prisma } from './prisma.js';

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails('mailto:bidnest@localhost', vapidPublic, vapidPrivate);
}

/**
 * Send push notification to all subscriptions for a user.
 * @param {string} userId
 * @param {{ title: string; body: string; tag?: string }} payload
 */
export async function sendPushToUser(userId, payload) {
  if (!vapidPublic || !vapidPrivate) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag || 'bidnest',
  });
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        body,
        { TTL: 3600 }
      )
    )
  );
}
