"use client";

import { cn } from "@repo/ui";
import { BookmarkIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const tabs = [
	{ label: "Buscar", href: "/github", icon: SearchIcon },
	{ label: "Favoritos", href: "/github/favoritos", icon: BookmarkIcon },
];

function GitHubNavInner({ favoritesCount }: { favoritesCount: number }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const q = searchParams.get("q");

	return (
		<nav className="gap-1 flex border-b">
			{tabs.map(({ label, href, icon: Icon }) => {
				const isActive = pathname === href;
				const isFavorites = href === "/github/favoritos";
				const resolvedHref = q ? `${href}?q=${encodeURIComponent(q)}` : href;
				return (
					<Link
						key={href}
						href={resolvedHref}
						className={cn(
							"gap-2 px-4 py-2.5 -mb-px flex items-center border-b-2 text-sm transition-colors",
							isActive
								? "border-foreground font-medium text-foreground"
								: "border-transparent text-foreground/50 hover:text-foreground",
						)}
					>
						<Icon className="size-4" />
						{label}
						{isFavorites && favoritesCount > 0 && (
							<span className={cn(
								"rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
								isActive
									? "bg-foreground text-background"
									: "bg-foreground/10 text-foreground/60",
							)}>
								{favoritesCount}
							</span>
						)}
					</Link>
				);
			})}
		</nav>
	);
}

export function GitHubNav({ favoritesCount }: { favoritesCount: number }) {
	return (
		<Suspense fallback={<div className="h-10 border-b" />}>
			<GitHubNavInner favoritesCount={favoritesCount} />
		</Suspense>
	);
}