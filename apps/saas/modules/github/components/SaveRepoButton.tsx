"use client";

import { Button } from "@repo/ui";
import { BookmarkIcon } from "lucide-react";
import { useTransition } from "react";
import { toggleFavoriteRepoAction } from "@github/lib/actions";

interface SaveRepoButtonProps {
	repoId: string;
	repoName: string;
	repoUrl: string;
	isFavorite: boolean;
}

export function SaveRepoButton({
	repoId,
	repoName,
	repoUrl,
	isFavorite,
}: SaveRepoButtonProps) {
	const [isPending, startTransition] = useTransition();

	const handleClick = () => {
		startTransition(() => {
			toggleFavoriteRepoAction({ repoId, repoName, repoUrl }, isFavorite);
		});
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleClick}
			disabled={isPending}
			className="shrink-0 border-foreground text-foreground"
			aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
		>
			<BookmarkIcon className={isFavorite ? "size-3.5 fill-foreground" : "size-3.5"} />
			{isFavorite ? "Quitar" : "Guardar"}
		</Button>
	);
}