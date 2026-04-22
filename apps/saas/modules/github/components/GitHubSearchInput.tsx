"use client";

import { Button } from "@repo/ui";
import { Input } from "@repo/ui/components/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function GitHubSearchInput() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
		e.preventDefault();
		const query = new FormData(e.currentTarget).get("q") as string;

		startTransition(() => {
			router.push(`/github?q=${encodeURIComponent(query.trim())}`);
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<div className="relative flex-1">
				<SearchIcon className="top-1/2 left-3 size-4 -translate-y-1/2 absolute text-foreground/40" />
				<Input
					name="q"
					defaultValue={searchParams.get("q") ?? ""}
					placeholder="Buscar repositorios en GitHub..."
					className="pl-9"
					autoFocus
				/>
			</div>
			<Button
				type="submit"
				disabled={isPending}
				className="border-foreground text-foreground"
				variant="outline"
			>
				{isPending ? "Buscando..." : "Buscar"}
			</Button>
		</form>
	);
}