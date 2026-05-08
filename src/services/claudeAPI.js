// Claude API triage service
// Calls claude-sonnet-4-20250514 to classify tier, generate recommendations,
// and surface historically effective interventions from the local effectiveness DB

import Anthropic from '@anthropic-ai/sdk';
import { querySimilarInterventions } from './storage';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function buildPrompt(student, similarInterventions) {
  const historicalSection =
    similarInterventions.length > 0
      ? `\nHistorically effective interventions for similar student profiles (use as suggestions where relevant):\n${similarInterventions
          .map(
            (r, i) =>
              `${i + 1}. "${r.interventionDescription}" — Outcome score: ${r.outcomeScore}/100 (${r.interventionOwner})`
          )
          .join('\n')}`
      : '\nNo historical effectiveness data yet for similar profiles.';

  return `You are an MTSS (Multi-Tiered System of Supports) specialist helping K-12 school counselors triage at-risk students.

Student Profile:
- Name: ${student.name}
- Grade: ${student.grade}
- Attendance Rate: ${Math.round(student.attendanceRate * 100)}%
- Math Assessment Score: ${student.mathScore}/100
- Consecutive Weeks of Declining Performance: ${student.consecutiveWeeksDecline}
${historicalSection}

Please respond in the following JSON format only (no markdown, no explanation outside the JSON):
{
  "tier": <1, 2, or 3>,
  "rationale": "<1-2 sentence explanation of tier classification>",
  "recommendations": [
    {
      "action": "<clear, specific action description>",
      "owner": "<role, e.g. School Counselor, Math Teacher, Parent Liaison>",
      "timeframe": "<e.g. Begin within 1 week, Within 2 weeks, Ongoing monthly>"
    }
  ],
  "historicalNotes": "<brief note on historically effective interventions for similar profiles, or null if none>"
}

Rules:
- Provide exactly 2 or 3 recommendations (no more, no fewer)
- Tier 3 = severe risk (attendance < 75% OR math < 55), Tier 2 = moderate risk, Tier 1 = on track
- Each recommendation must be specific to THIS student's actual numbers, not generic
- Owner must be one of: School Counselor, Math Teacher, Parent Liaison, Administrator, Reading Specialist`;
}

export async function triageStudent(student) {
  if (!API_KEY) {
    // Return a realistic mock triage when no API key is configured
    return mockTriage(student);
  }

  const profile = {
    tier: student.tier,
    grade: student.grade,
    attendanceRate: student.attendanceRate,
    mathScore: student.mathScore,
  };

  const similar = querySimilarInterventions(profile);

  const client = new Anthropic({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: buildPrompt(student, similar),
      },
    ],
  });

  const text = message.content[0]?.text ?? '';

  try {
    return JSON.parse(text);
  } catch {
    // Attempt to extract JSON if there's surrounding text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Claude returned unexpected format');
  }
}

// Realistic mock triage for demo without API key
function mockTriage(student) {
  const { attendanceRate, mathScore, consecutiveWeeksDecline, grade, name } = student;
  const pct = Math.round(attendanceRate * 100);

  let tier, rationale, recommendations;

  if (attendanceRate < 0.75 || mathScore < 55) {
    tier = 3;
    rationale = `${name} shows critical indicators with ${pct}% attendance and a math score of ${mathScore}/100. Immediate intensive support is required to prevent further academic decline.`;
    recommendations = [
      {
        action: `Schedule a same-week check-in meeting with ${name} to identify barriers to attendance and create a personalized attendance improvement contract.`,
        owner: 'School Counselor',
        timeframe: 'Begin within 1 week',
      },
      {
        action: `Provide daily 30-minute small-group math intervention targeting foundational skills at the ${grade}th grade level, with progress monitoring every two weeks.`,
        owner: 'Math Teacher',
        timeframe: 'Begin within 1 week',
      },
      {
        action: `Contact family to schedule a home-school conference and discuss transportation, health, or family factors contributing to ${Math.round((1 - attendanceRate) * 100)}% absences.`,
        owner: 'Parent Liaison',
        timeframe: 'Begin within 1 week',
      },
    ];
  } else if (attendanceRate < 0.90 || mathScore < 75) {
    tier = 2;
    rationale = `${name} is showing moderate risk with ${pct}% attendance and a math score of ${mathScore}/100${consecutiveWeeksDecline > 2 ? `, with ${consecutiveWeeksDecline} consecutive weeks of decline` : ''}. Targeted support should be initiated.`;
    recommendations = [
      {
        action: `Implement a weekly check-in/check-out system with ${name} to monitor engagement and flag early warning signs before they escalate.`,
        owner: 'School Counselor',
        timeframe: 'Begin within 2 weeks',
      },
      {
        action: `Enroll in a math tutoring session twice per week, focusing on identified skill gaps from the most recent assessment (score: ${mathScore}/100).`,
        owner: 'Math Teacher',
        timeframe: 'Begin within 2 weeks',
      },
    ];
  } else {
    tier = 1;
    rationale = `${name} is performing on track with ${pct}% attendance and a strong math score of ${mathScore}/100. Universal supports and periodic monitoring are sufficient at this time.`;
    recommendations = [
      {
        action: `Continue universal classroom supports and include ${name} in monthly grade-level check-ins to sustain current performance.`,
        owner: 'Math Teacher',
        timeframe: 'Ongoing monthly',
      },
      {
        action: `Recognize academic achievement with positive behavior reinforcement and consider enrichment opportunities if performance continues to excel.`,
        owner: 'School Counselor',
        timeframe: 'Within 2 weeks',
      },
    ];
  }

  return {
    tier,
    rationale,
    recommendations,
    historicalNotes: null,
  };
}
