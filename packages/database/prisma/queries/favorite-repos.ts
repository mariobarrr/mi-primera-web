import { db } from "../client";

export async function getFavoriteReposByUserId(userId: string) {
	return db.favoriteRepo.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function isFavoriteRepo(userId: string, repoId: string) {
	const repo = await db.favoriteRepo.findUnique({
		where: { userId_repoId: { userId, repoId } },
	});
	return repo !== null;
}

export async function addFavoriteRepo(
	userId: string,
	data: { repoId: string; repoName: string; repoUrl: string },
) {
	return db.favoriteRepo.create({
		data: { userId, ...data },
	});
}

export async function removeFavoriteRepo(userId: string, repoId: string) {
	await db.favoriteRepo.delete({
		where: { userId_repoId: { userId, repoId } },
	});
}