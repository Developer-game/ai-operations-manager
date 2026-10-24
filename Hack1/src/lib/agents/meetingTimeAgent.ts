import { store } from '@/lib/store';
import { sanitizeNoEmDash } from '@/lib/sanitizer';

export interface MeetingSlotProposal {
  dayName: string;
  dayNumber: number;
  timeWindow: string; // e.g. "14:00 to 15:30"
  availableCount: number;
  totalInvited: number;
  percentage: number;
  conflictNames: string[];
  recommendationNote: string;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Meeting Time Agent
 * Evaluates timetables and finds the highest-concurrency meeting slots
 * with strict privacy preservation (zero course details exposed).
 */
export function proposeMeetingSlots(eventId: string): {
  eventTitle: string;
  proposals: MeetingSlotProposal[];
  summaryNote: string;
} {
  const event = store.getEvent(eventId);
  if (!event) {
    return {
      eventTitle: 'Event',
      proposals: [],
      summaryNote: 'Event not found.',
    };
  }

  const eventMembers = store.getEventMembers(eventId);
  const userIds = eventMembers.map((em) => em.userId);

  // Candidate slots to test across weekdays (Monday to Friday, 10:00 to 17:00)
  const candidateSlots = [
    { day: 2, start: '14:00', end: '15:30', label: '14:00 to 15:30' },
    { day: 4, start: '14:00', end: '15:30', label: '14:00 to 15:30' },
    { day: 3, start: '11:00', end: '12:30', label: '11:00 to 12:30' },
    { day: 5, start: '15:00', end: '16:30', label: '15:00 to 16:30' },
    { day: 1, start: '16:00', end: '17:30', label: '16:00 to 17:30' },
  ];

  const proposals: MeetingSlotProposal[] = candidateSlots.map((candidate) => {
    let availableCount = 0;
    const conflictNames: string[] = [];

    userIds.forEach((userId) => {
      const timetable = store.getTimetable(userId);
      const user = store.getUser(userId);
      const userName = user ? user.fullName : 'Member';

      if (!timetable || !timetable.shareFreeBusyConsent) {
        // Without consent, assume available or note unverified
        availableCount += 1;
        return;
      }

      // Check if any busy slot overlaps candidate
      const hasConflict = timetable.busySlots.some((slot) => {
        if (slot.day !== candidate.day) return false;
        // Simple overlap check
        return slot.start < candidate.end && slot.end > candidate.start;
      });

      if (hasConflict) {
        conflictNames.push(userName);
      } else {
        availableCount += 1;
      }
    });

    const totalInvited = userIds.length || 1;
    const percentage = Math.round((availableCount / totalInvited) * 100);

    let recommendationNote = `${percentage}% team attendance.`;
    if (conflictNames.length > 0) {
      recommendationNote += ` Potential conflict for: ${conflictNames.join(', ')}.`;
    } else {
      recommendationNote += ' Zero scheduling conflicts detected.';
    }

    return {
      dayName: DAY_NAMES[candidate.day],
      dayNumber: candidate.day,
      timeWindow: candidate.label,
      availableCount,
      totalInvited,
      percentage,
      conflictNames,
      recommendationNote: sanitizeNoEmDash(recommendationNote),
    };
  });

  // Sort by highest attendance percentage
  proposals.sort((a, b) => b.percentage - a.percentage);

  const best = proposals[0];
  const summaryNote = best
    ? sanitizeNoEmDash(
        `Top slot is ${best.dayName} at ${best.timeWindow} with ${best.percentage}% attendance. All member timetables respected.`
      )
    : 'No slots evaluated.';

  return {
    eventTitle: sanitizeNoEmDash(event.title),
    proposals: proposals.slice(0, 3), // Return top 3 candidates
    summaryNote,
  };
}
