export interface GitHubRepoResponse {
  stargazers_count: number;
}

export function isGitHubRepoResponse(value: unknown): value is GitHubRepoResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.stargazers_count === "number";
}

export function formatStarCount(count: number): string {
  if (count >= 1000) {
    const formatted = (count / 1000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
  }
  return String(count);
}

export function extractGitHubRepoSlug(githubUrl: string): string {
  const cleaned = githubUrl
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
  return cleaned || "Jhonatanmizu/snuts.js-core";
}

export async function fetchGitHubStars(repoSlug: string, fallbackStars: string): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoSlug}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) {
      return fallbackStars;
    }
    const payload: unknown = await response.json();
    if (isGitHubRepoResponse(payload)) {
      return formatStarCount(payload.stargazers_count);
    }
    return fallbackStars;
  } catch {
    return fallbackStars;
  }
}
