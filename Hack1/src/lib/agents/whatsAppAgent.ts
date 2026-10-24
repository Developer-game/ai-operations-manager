import { store } from '@/lib/store';
import { sanitizeNoEmDash } from '@/lib/sanitizer';

export type WhatsAppTemplateType = 'urgent_alert' | 'broadcast_invite' | 'polite_checkin';

export interface WhatsAppDraftResult {
  templateName: string;
  templateType: WhatsAppTemplateType;
  body: string;
  eligibleRecipients: Array<{ name: string; phone: string }>;
  optedOutCount: number;
  totalMembersCount: number;
}

export function draftWhatsAppMessage(
  orgId: string,
  templateType: WhatsAppTemplateType,
  details: { eventTitle?: string; location?: string; customNote?: string }
): WhatsAppDraftResult {
  const membersWithDetails = store.getMembersWithDetails(orgId);
  const eligibleRecipients: Array<{ name: string; phone: string }> = [];
  let optedOutCount = 0;

  membersWithDetails.forEach((m) => {
    if (m.user && m.user.phoneOptIn && m.user.phoneNumber) {
      eligibleRecipients.push({
        name: m.user.fullName,
        phone: m.user.phoneNumber,
      });
    } else {
      optedOutCount += 1;
    }
  });

  const org = store.getCurrentOrg();
  const orgName = org ? org.name : 'Society';
  const eventTitle = details.eventTitle || 'Upcoming Meeting';
  const location = details.location || 'Society Room';

  let templateName = '';
  let body = '';

  switch (templateType) {
    case 'urgent_alert':
      templateName = 'society_urgent_notification_v1';
      body = `[Urgent Notice from ${orgName}]\nHello {{name}}, important update regarding ${eventTitle} at ${location}. ${
        details.customNote || 'Please check your dashboard tasks immediately.'
      }\nReply STOP to opt out.`;
      break;
    case 'broadcast_invite':
      templateName = 'society_event_broadcast_v1';
      body = `[Invitation from ${orgName}]\nHi {{name}}! You are invited to ${eventTitle}. Location: ${location}. Please confirm your attendance in the society app.\nReply STOP to opt out.`;
      break;
    case 'polite_checkin':
      templateName = 'society_member_checkin_v1';
      body = `[Check-in from ${orgName}]\nHi {{name}}, just checking in on your assigned duties for ${eventTitle}. Reach out if you need assistance!\nReply STOP to opt out.`;
      break;
  }

  return {
    templateName,
    templateType,
    body: sanitizeNoEmDash(body),
    eligibleRecipients,
    optedOutCount,
    totalMembersCount: membersWithDetails.length,
  };
}
