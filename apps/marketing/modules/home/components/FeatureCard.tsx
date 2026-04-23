import { cn } from "@repo/ui";

interface FeatureCardProps {
	icon: string;
	title: string;
	description: string;
	className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
	return (
		<div className={cn("p-6 lg:p-8 flex flex-col rounded-3xl border bg-card", className)}>
			<span className="text-3xl" role="img" aria-hidden="true">
				{icon}
			</span>
			<strong className="mt-4 font-medium text-lg block text-foreground">
				{title}
			</strong>
			<p className="mt-2 text-sm text-foreground/60">
				{description}
			</p>
		</div>
	);
}
