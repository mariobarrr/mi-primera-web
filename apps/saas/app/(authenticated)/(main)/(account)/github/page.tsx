import { getSession } from "@auth/lib/server";
import { GitHubRepositoryList } from "@github/components/GitHubRepositoryList";
import { GitHubSearchInput } from "@github/components/GitHubSearchInput";
import { GitHubNav } from "@github/components/GitHubNav";
import { PageHeader } from "@shared/components/PageHeader";
import { getFavoriteReposByUserId } from "@repo/database";

export default async function GitHubPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const [{ q }, session] = await Promise.all([searchParams, getSession()]);
	const favorites = session ? await getFavoriteReposByUserId(session.user.id) : [];

	return (
		<>
			<PageHeader
				title="GitHub"
				subtitle="Busca y guarda repositorios"
			/>

			<div className="mt-6 space-y-6">
				<GitHubNav favoritesCount={favorites.length} />

				<GitHubSearchInput />

				{q ? (
					<GitHubRepositoryList query={q} />
				) : (
					<p className="text-sm text-foreground/60">
						Escribe algo para buscar repositorios.
					</p>
				)}
			</div>
		</>
	);
}