import { GitHubRepositoryList } from "@github/components/GitHubRepositoryList";
import { GitHubSearchInput } from "@github/components/GitHubSearchInput";
import Link from "next/link";

export default async function ExplorarPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

				<div className="rounded-lg border bg-muted/40 px-5 py-4 flex items-center justify-between gap-4 text-sm">
					<p className="text-foreground/70">
						Estás navegando como invitado. Inicia sesión para guardar favoritos.
					</p>
					<Link
						href="/login"
						className="shrink-0 font-medium text-primary hover:underline"
					>
						Iniciar sesión →
					</Link>
				</div>

				<div>
					<h1 className="text-2xl font-bold">Buscar repositorios</h1>
					<p className="mt-1 text-sm text-foreground/60">Explora proyectos en GitHub</p>
				</div>

				<div className="space-y-6">
					<GitHubSearchInput />

					{q ? (
						<GitHubRepositoryList query={q} />
					) : (
						<p className="text-sm text-foreground/60">
							Escribe algo para buscar repositorios.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
