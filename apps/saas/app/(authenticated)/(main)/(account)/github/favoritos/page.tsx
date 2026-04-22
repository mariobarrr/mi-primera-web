import { getSession } from "@auth/lib/server";
import { getFavoriteReposByUserId } from "@repo/database";
import { FavoriteRepoCard } from "@github/components/FavoriteRepoCard";
import { GitHubNav } from "@github/components/GitHubNav";
import { PageHeader } from "@shared/components/PageHeader";
import { redirect } from "next/navigation";

export default async function GitHubFavoritosPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const [{ q }, session] = await Promise.all([searchParams, getSession()]);
	if (!session) redirect("/login");

	const favorites = await getFavoriteReposByUserId(session.user.id);

	return (
		<>
			<PageHeader
				title="GitHub"
				subtitle="Busca y guarda repositorios"
			/>

			<div className="mt-6 space-y-6">
				<GitHubNav favoritesCount={favorites.length} />

				{favorites.length === 0 ? (
					<div className="rounded-lg border p-8 text-center text-sm text-foreground/60">
						Todavía no tienes repositorios guardados. Búscalos en la pestaña Buscar.
					</div>
				) : (
					<ul className="space-y-4">
						{favorites.map((repo) => (
							<FavoriteRepoCard
								key={repo.id}
								repoId={repo.repoId}
								repoName={repo.repoName}
								repoUrl={repo.repoUrl}
							/>
						))}
					</ul>
				)}
			</div>
		</>
	);
}