"use server";

import { getSession } from "@auth/lib/server";
import { createNote, deleteNote, updateNote } from "@repo/database";
import { revalidatePath } from "next/cache";

export async function createNoteAction({
	title,
	content,
}: {
	title: string;
	content?: string;
}) {
	const session = await getSession();

	if (!session) {
		throw new Error("No autenticado");
	}

	await createNote({
		title,
		content: content ?? null,
		userId: session.user.id,
	});

	revalidatePath("/dashboard/mis-notas");
}

export async function updateNoteAction({
	id,
	title,
	content,
}: {
	id: string;
	title: string;
	content?: string;
}) {
	const session = await getSession();

	if (!session) {
		throw new Error("No autenticado");
	}

	await updateNote({
		id,
		title,
		content: content ?? null,
		userId: session.user.id,
	});

	revalidatePath("/dashboard/mis-notas");
}

export async function deleteNoteAction(id: string) {
	const session = await getSession();

	if (!session) {
		throw new Error("No autenticado");
	}

	await deleteNote(id);

	revalidatePath("/dashboard/mis-notas");
}