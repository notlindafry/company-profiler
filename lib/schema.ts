// The shape of a researched profile. The API route validates that Claude's
// output matches this before sending it to the page.

export interface Tenure {
  startDate: string; // e.g. "2024-03" or "Not found"
  durationText: string; // e.g. "1 year 2 months" or "Not found"
}

export interface CareerHistoryItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  note: string;
  source?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year: string;
  source?: string;
}

export interface CareerNote {
  note: string;
  source?: string;
}

export type MediaType = "interview" | "article" | "talk" | "podcast" | "other";

export interface MediaItem {
  title: string;
  type: MediaType;
  date: string;
  url: string;
}

export interface Announcement {
  summary: string;
  date: string;
  url: string;
}

export interface LinkedIn {
  profileUrl: string;
  publicActivitySummary: string;
  themes: string[];
}

export interface FitAndAngle {
  execLikelyPriorities: string[];
  whyYouConnect: string[];
  talkingPoints: string[];
  questionsToAsk: string[];
}

export interface ExecutiveProfile {
  name: string;
  currentTitle: string;
  currentCompany: string;
  tenure: Tenure;
  careerHistory: CareerHistoryItem[];
  education: EducationItem[];
  careerNotes: CareerNote[];
  mediaAndPublications: MediaItem[];
  announcementsSinceJoining: Announcement[];
  linkedin: LinkedIn;
  fitAndAngle: FitAndAngle;
  unknowns: string[];
}
