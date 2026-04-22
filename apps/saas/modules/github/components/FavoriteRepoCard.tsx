import { SaveRepoButton } from "./SaveRepoButton";

interface FavoriteRepoCardProps {
	repoId: string;
	repoName: string;
	repoUrl: string;
}

export function FavoriteRepoCard({ repoId, repoName, repoUrl }: FavoriteRepoCardProps) {
	return (
		<li className="rounded-lg border bg-card p-5">
			<div className="gap-3 flex items-center justify-between">
				<a
					href={repoUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium text-primary hover:underline truncate"
				>
					{repoName}
				</a>

				<SaveRepoButton
					repoId={repoId}
					repoName={repoName}
					repoUrl={repoUrl}
					isFavorite={true}
				/>
			</div>
		</li>
	);
}