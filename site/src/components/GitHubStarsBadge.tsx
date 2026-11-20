import * as React from "react";

import { fetchGitHubStars } from "@/lib/github";

export interface GitHubStarsBadgeProps {
  repoSlug: string;
  initialStars: string;
}

export function GitHubStarsBadge({
  repoSlug,
  initialStars,
}: GitHubStarsBadgeProps): React.ReactElement {
  const [stars, setStars] = React.useState<string>(initialStars);

  React.useEffect((): (() => void) => {
    let active = true;
    void fetchGitHubStars(repoSlug, initialStars).then((liveStars): void => {
      if (active) {
        setStars(liveStars);
      }
    });
    return (): void => {
      active = false;
    };
  }, [repoSlug, initialStars]);

  return (
    <span className="inline-flex items-center rounded-pill bg-snuts-accent-14 px-[7px] py-[2px] font-mono text-[10px] font-medium text-snuts-text">
      {stars}
    </span>
  );
}
