import { getSession } from "@auth/lib/server";
import { getFavoriteReposByUserId } from "@repo/database";
import { SaveRepoButton } from "./SaveRepoButton";

interface GitHubSearchResponse {
	total_count: number;
	incomplete_results: boolean;
	items: GitHubRepository[];
}

interface GitHubRepository {
	id: number;
	full_name: string;
	description: string | null;
	html_url: string;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	owner: {
		login: string;
		avatar_url: string;
	};
}

async function searchRepositories(query: string): Promise<GitHubSearchResponse> {
	const res = await fetch(
		`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`,
		{
			headers: {
				Accept: "application/vnd.github+json",
			},
			next: { revalidate: 60 },
		},
	);

	if (!res.ok) {
		throw new Error(`GitHub API error: ${res.status}`);
	}

	return res.json() as Promise<GitHubSearchResponse>;
}

export async function GitHubRepositoryList({ query }: { query: string }) {
	const session = await getSession();

	const [data, favorites] = await Promise.all([
		searchRepositories(query).catch(() => null),
		session ? getFavoriteReposByUserId(session.user.id) : Promise.resolve([]),
	]);

	if (!data) {
		return (
			<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
				No se pudieron cargar los resultados de GitHub. Inténtalo de nuevo más tarde.
			</div>
		);
	}

	if (data.items.length === 0) {
		return (
			<p className="text-sm text-foreground/60">
				No se encontraron repositorios para "{query}".
			</p>
		);
	}

	const favoriteIds = new Set(favorites.map((f) => f.repoId));

	return (
		<div>
			<p className="mb-4 text-sm text-foreground/60">
				{data.total_count.toLocaleString()} resultados
			</p>

			<ul className="space-y-4">
				{data.items.map((repo) => (
					<li key={repo.id} className="rounded-lg border bg-card p-5">
						<div className="gap-3 flex items-center justify-between">
							<div className="gap-3 flex min-w-0 items-center">
								<img
									src={repo.owner.avatar_url}
									alt={repo.owner.login}
									className="size-6 shrink-0 rounded-full"
								/>
								<a
									href={repo.html_url}
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium text-primary hover:underline truncate"
								>
									{repo.full_name}
								</a>
							</div>

							{session && (
								<SaveRepoButton
									repoId={String(repo.id)}
									repoName={repo.full_name}
									repoUrl={repo.html_url}
									isFavorite={favoriteIds.has(String(repo.id))}
								/>
							)}
						</div>

						{repo.description && (
							<p className="mt-2 text-sm text-foreground/60">{repo.description}</p>
						)}

						<div className="gap-4 mt-3 flex items-center text-xs text-foreground/40">
							{repo.language && <span>{repo.language}</span>}
							<span>⭐ {repo.stargazers_count.toLocaleString()}</span>
							<span>🍴 {repo.forks_count.toLocaleString()}</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}