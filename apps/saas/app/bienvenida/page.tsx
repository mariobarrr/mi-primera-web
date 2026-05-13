import { BookmarkIcon, GitBranchIcon, NotebookIcon } from "lucide-react";
import Link from "next/link";

const features = [
	{
		icon: GitBranchIcon,
		title: "Buscador de GitHub",
		description: "Busca repositorios públicos de GitHub y guarda tus favoritos.",
	},
	{
		icon: BookmarkIcon,
		title: "Favoritos",
		description: "Guarda y organiza los repositorios que más te interesan.",
	},
	{
		icon: NotebookIcon,
		title: "Mis notas",
		description: "Crea, edita y elimina notas personales en tu espacio privado.",
	},
];

export default function BienvenidaPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b px-6 py-4 flex items-center justify-between">
				<span className="font-semibold text-lg">mi-primera-web</span>
				<div className="gap-3 flex items-center">
					<Link
						href="/login"
						className="text-sm text-foreground/70 hover:text-foreground transition-colors"
					>
						Iniciar sesión
					</Link>
					<Link
						href="/signup"
						className="text-sm font-medium border border-foreground text-foreground rounded-md px-4 py-1.5 hover:bg-foreground hover:text-background transition-colors"
					>
						Crear cuenta
					</Link>
				</div>
			</header>

			<main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
				<h1 className="text-4xl font-bold tracking-tight">
					Tu espacio para explorar y organizar
				</h1>
				<p className="mt-4 max-w-md text-foreground/60 text-lg">
					Busca repositorios de GitHub, guarda tus favoritos y toma notas — todo en un solo lugar.
				</p>

				<div className="gap-3 mt-8 flex flex-wrap justify-center">
					<Link
						href="/signup"
						className="font-medium bg-foreground text-background rounded-md px-6 py-2.5 hover:opacity-90 transition-opacity"
					>
						Crear cuenta gratis
					</Link>
					<Link
						href="/login"
						className="font-medium border border-foreground text-foreground rounded-md px-6 py-2.5 hover:bg-accent transition-colors"
					>
						Iniciar sesión
					</Link>
				</div>

				<div className="gap-6 mt-20 grid grid-cols-1 sm:grid-cols-3 max-w-3xl w-full text-left">
					{features.map(({ icon: Icon, title, description }) => (
						<div key={title} className="rounded-lg border bg-card p-6 space-y-3">
							<Icon className="size-6 text-foreground/70" />
							<h3 className="font-semibold">{title}</h3>
							<p className="text-sm text-foreground/60">{description}</p>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
