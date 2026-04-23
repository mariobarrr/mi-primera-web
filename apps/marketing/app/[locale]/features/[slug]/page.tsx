import { features, getFeatureBySlug } from "@home/lib/features";
import { LocaleLink } from "@i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export function generateStaticParams() {
	return features.map((feature) => ({ slug: feature.slug }));
}

type Params = {
	slug: string;
	locale: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const { slug } = await props.params;
	const feature = getFeatureBySlug(slug);

	return {
		title: feature?.title,
		description: feature?.summary,
	};
}

export default async function FeatureDetailPage(props: { params: Promise<Params> }) {
	const { slug, locale } = await props.params;
	setRequestLocale(locale);

	const feature = getFeatureBySlug(slug);

	if (!feature) {
		notFound();
	}

	const { icon, title, summary, description, benefits } = feature;

	return (
		<div className="py-16 container">
			<div className="mb-8">
				<LocaleLink href="/features" className="text-sm text-foreground/60 hover:text-foreground">
					&larr; Features
				</LocaleLink>
			</div>

			<div className="max-w-3xl mx-auto">
				<span className="text-5xl" role="img" aria-hidden="true">
					{icon}
				</span>

				<h1 className="mt-6 font-bold text-4xl md:text-5xl text-foreground">
					{title}
				</h1>

				<p className="mt-4 text-xl text-foreground/60 text-balance">
					{summary}
				</p>

				<p className="mt-8 text-base text-foreground/80 leading-relaxed">
					{description}
				</p>

				<div className="mt-10 p-6 lg:p-8 rounded-3xl border bg-card">
					<h2 className="font-semibold text-lg text-foreground">
						Lo que incluye
					</h2>
					<ul className="mt-4 space-y-3">
						{benefits.map((benefit) => (
							<li key={benefit} className="gap-3 flex items-start text-sm text-foreground/80">
								<span className="text-primary mt-0.5">✓</span>
								{benefit}
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
