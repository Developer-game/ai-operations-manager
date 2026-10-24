import { store } from '@/lib/store';
import { sanitizeNoEmDash } from '@/lib/sanitizer';
import { SocialPlatform, SocialPost } from '@/types';

export interface GeneratedSocialDraft {
  platform: SocialPlatform;
  caption: string;
  recommendedTime: string;
  posterPrompt: string;
  suggestedImageUrl: string;
}

const STOCK_POSTERS = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
];

/**
 * Media and Asset Agent
 * Generates captions, hashtags, and poster concepts.
 * Guardrail: Saves strictly in DRAFT state. Explicit human approval is required.
 */
export function generateSocialCampaign(
  eventId: string,
  platform: SocialPlatform
): GeneratedSocialDraft {
  const event = store.getEvent(eventId);
  const eventTitle = event ? event.title : 'Society Event';
  const eventLoc = event ? event.location : 'Campus Main Hall';
  const eventDate = event ? new Date(event.startTime).toLocaleDateString() : 'Coming Soon';

  let caption = '';
  let posterPrompt = '';
  const recommendedTime = 'Tomorrow at 10:00 AM (Optimal student engagement window)';
  const randomImage = STOCK_POSTERS[Math.floor(Math.random() * STOCK_POSTERS.length)];

  if (platform === 'instagram') {
    caption = `Ready for takeoff? Join us for ${eventTitle} on ${eventDate} at ${eventLoc}. Watch live demonstrations, meet the engineering team, and discover how our autonomous systems work. Free entry for all students! #Robotics #Engineering #StudentLife #TechInnovations`;
    posterPrompt = `Dynamic visual of an autonomous quadcopter hovering in an engineering lab with glowing cyan telemetry vectors and subtle depth of field.`;
  } else if (platform === 'linkedin') {
    caption = `The society is pleased to announce our upcoming demonstration: ${eventTitle}. On ${eventDate}, student engineers will present hardware calibration and software flight controls at ${eventLoc}. We welcome industry partners, alumni, and prospective members to attend.`;
    posterPrompt = `Professional minimalist flyer with clean typography, university crest area, and sleek robotics schematic background.`;
  } else {
    caption = `Join us for ${eventTitle} on ${eventDate} at ${eventLoc}! Live flights, real-time telemetry, and technical Q&A with the crew. All students welcome.`;
    posterPrompt = `Bold typography announcement banner with modern geometric layout.`;
  }

  return {
    platform,
    caption: sanitizeNoEmDash(caption),
    recommendedTime: sanitizeNoEmDash(recommendedTime),
    posterPrompt: sanitizeNoEmDash(posterPrompt),
    suggestedImageUrl: randomImage,
  };
}

/**
 * Stages the generated draft into the store. Post starts in "draft" status.
 */
export function stageGeneratedPost(
  orgId: string,
  platform: SocialPlatform,
  caption: string,
  imageUrl?: string
): SocialPost {
  let assetId: string | undefined = undefined;

  if (imageUrl) {
    const asset = store.addMediaAsset(orgId, {
      fileUrl: imageUrl,
      fileName: `ai_generated_${platform}_poster.jpg`,
      fileType: 'image/jpeg',
      fileSize: 1024000,
      uploadedByUserId: store.getCurrentUser()?.id || 'usr-alex',
    });
    assetId = asset.id;
  }

  return store.createSocialPost({
    organisationId: orgId,
    assetId,
    platform,
    caption: sanitizeNoEmDash(caption),
    status: 'draft', // Always draft until human confirms
  });
}
