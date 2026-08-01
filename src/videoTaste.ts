// Local taste profile for the Shorts feed. Likes and dislikes never leave the
// browser — they're only used here to decide what to search for next.
import type { YtVideo } from "./ytApi";

export type Reaction = "like" | "dislike";

export type ReactionEntry = {
  id: string;
  channelId: string;
  channel: string;
  title: string;
  reaction: Reaction;
  t: number;
};

const KEY = "cbp_vid_reactions";
const CAP = 400;

// Cold-start topics. Deliberately spread across interests and deliberately
// free of music, since an unseeded feed used to fill up with music videos.
const SEED_TOPICS = [
  "funny",
  "gaming",
  "minecraft",
  "sports",
  "basketball",
  "soccer skills",
  "animals",
  "cooking",
  "science experiment",
  "satisfying",
  "cars",
  "magic tricks",
  "parkour",
  "life hacks",
  "skateboarding",
  "fails",
];

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","at","by","from","is","are",
  "was","were","be","been","it","its","this","that","these","those","i","you","he","she","we",
  "they","my","your","his","her","our","their","me","him","them","as","if","so","than","then",
  "when","how","what","why","who","which","not","no","yes","do","does","did","can","will","just",
  "up","out","get","got","go","goes","going","new","best","top","vs","shorts","short","video",
  "videos","youtube","subscribe","like","part","full","official","ep","episode","viral","trending",
]);

export function getReactions(): ReactionEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReactionEntry[]) : [];
  } catch {
    return [];
  }
}

function save(list: ReactionEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)));
  } catch {
    // storage unavailable — taste applies for this visit only
  }
}

export function getReaction(id: string): Reaction | null {
  return getReactions().find((r) => r.id === id)?.reaction ?? null;
}

/** Set (or toggle off, when repeated) a reaction. Returns the new value. */
export function setReaction(video: YtVideo, reaction: Reaction): Reaction | null {
  const list = getReactions();
  const existing = list.find((r) => r.id === video.id);
  const rest = list.filter((r) => r.id !== video.id);
  if (existing?.reaction === reaction) {
    save(rest); // pressing the same button again clears it
    return null;
  }
  save([
    {
      id: video.id,
      channelId: video.channelId,
      channel: video.channel,
      title: video.title,
      reaction,
      t: Date.now(),
    },
    ...rest,
  ]);
  return reaction;
}

export function clearReactions(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

export function reactionCounts(): { likes: number; dislikes: number } {
  const list = getReactions();
  return {
    likes: list.filter((r) => r.reaction === "like").length,
    dislikes: list.filter((r) => r.reaction === "dislike").length,
  };
}

/** Videos to never show again. */
export function dislikedIds(): Set<string> {
  return new Set(getReactions().filter((r) => r.reaction === "dislike").map((r) => r.id));
}

/** Channels disliked repeatedly, with no likes to offset them. */
export function blockedChannelIds(): Set<string> {
  const score = new Map<string, number>();
  for (const r of getReactions()) {
    if (!r.channelId) continue;
    score.set(r.channelId, (score.get(r.channelId) ?? 0) + (r.reaction === "like" ? 1 : -1));
  }
  return new Set([...score.entries()].filter(([, s]) => s <= -2).map(([id]) => id));
}

function likedChannels(n: number): { channelId: string; channel: string }[] {
  const score = new Map<string, { channel: string; score: number }>();
  for (const r of getReactions()) {
    if (r.reaction !== "like" || !r.channelId) continue;
    const prev = score.get(r.channelId);
    score.set(r.channelId, { channel: r.channel, score: (prev?.score ?? 0) + 1 });
  }
  return [...score.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, n)
    .map(([channelId, v]) => ({ channelId, channel: v.channel }));
}

/** Words that keep showing up in the titles you like. */
export function likedKeywords(n: number): string[] {
  const counts = new Map<string, number>();
  for (const r of getReactions()) {
    if (r.reaction !== "like") continue;
    const words = r.title
      .toLowerCase()
      .replace(/#\w+/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && w.length < 18 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
    for (const w of new Set(words)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

export type FeedQuery = { key: string; q?: string; channelId?: string };

function pickRandom<T>(arr: readonly T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/**
 * The searches that build your Shorts feed. With no likes yet it spreads across
 * varied topics; once you start liking things it leans on those channels and
 * the words that keep appearing, while still keeping one slot for something new
 * so the feed can't collapse into a single subject.
 */
export function buildShortsQueries(): FeedQuery[] {
  const queries: FeedQuery[] = [];
  const channels = likedChannels(2);
  const keywords = likedKeywords(6);

  for (const c of channels) {
    queries.push({ key: `chan:${c.channelId}`, channelId: c.channelId });
  }
  if (keywords.length >= 2) {
    queries.push({ key: `kw:${keywords.slice(0, 2).join(" ")}`, q: keywords.slice(0, 2).join(" ") });
  }
  if (keywords.length >= 4) {
    queries.push({ key: `kw:${keywords.slice(2, 4).join(" ")}`, q: keywords.slice(2, 4).join(" ") });
  }

  // Always leave room for discovery.
  const explore = pickRandom(SEED_TOPICS, queries.length === 0 ? 3 : 1);
  for (const topic of explore) queries.push({ key: `topic:${topic}`, q: topic });

  return queries.slice(0, 4);
}

/** Does this profile actually like music? Only then do we stop filtering it out. */
export function likesMusic(): boolean {
  const kw = new Set(likedKeywords(12));
  return ["music", "song", "remix", "beat", "lyrics", "cover", "audio"].some((w) => kw.has(w));
}
