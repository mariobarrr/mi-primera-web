"use server";

import { getSession } from "@auth/lib/server";
import { addFavoriteRepo, removeFavoriteRepo } from "@repo/database";
import { revalidatePath } from "next/cache";

export async function toggleFavoriteRepoAction(
	repo: { repoId: string; repoName: string; repoUrl: string },
	isFavorite: boolean,
) {
	const session = await getSession();
	if (!session) throw new Error("No autenticado");

	if (isFavorite) {
		await removeFavoriteRepo(session.user.id, repo.repoId);
	} else {
		await addFavoriteRepo(session.user.id, repo);
	}

	revalidatePath("/github");
}