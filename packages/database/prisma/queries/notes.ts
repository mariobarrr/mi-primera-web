import type { z } from "zod";

import { db } from "../client";
import type { NoteSchema } from "../zod";

export async function getNoteById(id: string) {
	return db.note.findUnique({
		where: { id },
	});
}

export async function getNotesByUserId(userId: string) {
	return db.note.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function createNote(
	note: Omit<z.infer<typeof NoteSchema>, "id" | "createdAt" | "updatedAt">,
) {
	const created = await db.note.create({
		data: note,
	});

	return getNoteById(created.id);
}

export async function updateNote(
	note: Partial<Omit<z.infer<typeof NoteSchema>, "createdAt" | "updatedAt">> & { id: string },
) {
	const updated = await db.note.update({
		where: { id: note.id },
		data: note,
	});

	return getNoteById(updated.id);
}

export async function deleteNote(id: string) {
	await db.note.delete({
		where: { id },
	});
}