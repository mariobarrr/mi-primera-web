import { FeatureCard } from "@home/components/FeatureCard";
import { features } from "@home/lib/features";
import { LocaleLink } from "@i18n/routing";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
	return {
		title: "Features",
		description: "Everything you need to build and launch your SaaS product.",
	};
}

export default async function FeaturesPage(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	return (
		<div className="py-16 container">
			<div className="mb-12 pt-8 text-center max-w-3xl mx-auto">
				<h1 className="mb-4 font-bold text-5xl">Features</h1>
				<p className="text-lg text-balance text-foreground/60">
					Everything you need to build and launch your SaaS product, without starting from scratch.
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{features.map((feature) => (
					<LocaleLink key={feature.slug} href={`/features/${feature.slug}`} className="block hover:no-underline">
						<FeatureCard
							icon={feature.icon}
							title={feature.title}
							description={feature.summary}
							className="h-full hover:border-primary/40 transition-colors duration-200"
						/>
					</LocaleLink>
				))}
			</div>
		</div>
	);
}
