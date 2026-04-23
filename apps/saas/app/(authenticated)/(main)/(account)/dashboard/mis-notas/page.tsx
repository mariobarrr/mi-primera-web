import { getSession } from "@auth/lib/server";
import { db } from "@repo/database";
import { CreateNoteForm } from "@notes/components/CreateNoteForm";
import { NoteCard } from "@notes/components/NoteCard";
import { PageHeader } from "@shared/components/PageHeader";
import { redirect } from "next/navigation";

export default async function MisNotasPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const notas = await db.note.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: "desc" },
	});

	return (
		<>
			<PageHeader
				title="Mis notas"
				subtitle={`${notas.length} nota${notas.length !== 1 ? "s" : ""}`}
			/>

			<div className="mt-6 rounded-lg border bg-card p-6">
				<h2 className="mb-4 font-medium">Nueva nota</h2>
				<CreateNoteForm />
			</div>

			{notas.length === 0 ? (
				<div className="mt-6 rounded-lg border p-8 text-center text-foreground/60">
					No tienes notas todavía.
				</div>
			) : (
				<ul className="mt-6 space-y-4">
					{notas.map((nota) => (
						<NoteCard
							key={nota.id}
							id={nota.id}
							title={nota.title}
							content={nota.content}
							createdAt={nota.createdAt}
						/>
					))}
				</ul>
			)}
		</>
	);
}