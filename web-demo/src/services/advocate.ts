/**
 * Scripted stand-in for the Gemini call in ChatAdvocate.tsx.
 *
 * The app sends the customer's message to Gemini together with an `update_claim_status` function declaration.
 * If the model decides the accident has been described clearly it calls the function, otherwise it replies
 * with a short question. This module makes the same decision with simple rules so the demo needs no API key.
 */

export interface AdvocateResult {
  /** Set when the "model" decided to call `update_claim_status`. */
  functionCall?: { name: 'update_claim_status'; args: { reason: string } };
  text?: string;
}

const INCIDENT =
  /\b(accident|collid\w*|collision|crash\w*|hit|bump\w*|scratch\w*|dent\w*|damag\w*|rear[- ]?end\w*|flood\w*|fire|stolen|theft|smash\w*|skid\w*|pothole|swerv\w*|reversed|knocked)\b/i;
const WHERE =
  /\b(at|on|near|along|junction|highway|lebuhraya|jalan|road|street|parking|traffic light|roundabout|toll|kl|petaling jaya|shah alam|johor|penang)\b/i;
const WHEN =
  /\b(today|yesterday|this morning|last night|tonight|this evening|afternoon|morning|ago|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[:.]\d{2}|\d{1,2}\s?(am|pm))\b/i;
const GREETING = /^(hi|hello|hey|salam|assalamualaikum|good (morning|afternoon|evening))\b/i;
const THANKS = /\b(thanks|thank you|terima kasih|tq)\b/i;
const COVERAGE = /\b(cover\w*|policy|policies|insured|insurance|premium)\b/i;

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function summarise(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 140 ? `${clean.slice(0, 137)}...` : clean;
}

/**
 * @param turn  0-based number of questions already asked in this conversation (varies the wording)
 * @param texts everything the customer has said since the last claim update
 */
export function respond(texts: string[], turn: number): AdvocateResult {
  const latest = texts[texts.length - 1] ?? '';
  const combined = texts.join(' ');

  const hasIncident = INCIDENT.test(combined);
  const hasDetail = WHERE.test(combined) || WHEN.test(combined);
  const clear = hasIncident && ((hasDetail && wordCount(combined) >= 8) || wordCount(combined) >= 20);

  if (clear) {
    return {
      functionCall: {
        name: 'update_claim_status',
        args: { reason: `Customer reports a vehicle incident: "${summarise(combined)}"` },
      },
    };
  }

  if (THANKS.test(latest) && !hasIncident) {
    return { text: "You're welcome! If anything else comes up with your claim, I'm here to help." };
  }
  if (COVERAGE.test(latest) && !hasIncident) {
    return {
      text: 'Your Pro-Drive Comprehensive policy (POL-2026-001) is active until 12 Dec 2026. Tell me what happened to your car and I will start your claim.',
    };
  }
  if (GREETING.test(latest) && wordCount(latest) <= 4) {
    return { text: 'Hello! I can help you file your claim. Please describe what happened to your car.' };
  }
  if (!hasIncident) {
    return {
      text: 'Thanks for reaching out. Could you tell me briefly what happened to your car, and where and when it took place?',
    };
  }

  const followUps = [
    "I'm sorry to hear that. Where and roughly when did it happen?",
    'Thanks, that helps. Was anyone injured, and which part of the car was damaged?',
    'Almost there. Could you add the location and the time of the incident so I can complete your claim?',
  ];
  return { text: followUps[turn % followUps.length] };
}
