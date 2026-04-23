export interface Feature {
	slug: string;
	icon: string;
	title: string;
	summary: string;
	description: string;
	benefits: string[];
}

export const features: Feature[] = [
	{
		slug: "performance",
		icon: "⚡",
		title: "Rápido por defecto",
		summary: "Construido sobre Next.js App Router con React Server Components para el máximo rendimiento.",
		description:
			"Cada página se renderiza en el servidor y solo se envía al navegador el JavaScript estrictamente necesario. Gracias a React Server Components, los componentes que no necesitan interactividad no añaden peso al bundle del cliente, lo que se traduce en tiempos de carga mínimos y métricas Core Web Vitals óptimas desde el primer día.",
		benefits: [
			"Renderizado en servidor por defecto",
			"Bundle de JavaScript reducido al mínimo",
			"Imágenes optimizadas automáticamente con next/image",
			"Fuentes sin flash de contenido no estilado (FOUT)",
		],
	},
	{
		slug: "authentication",
		icon: "🔒",
		title: "Seguro desde el inicio",
		summary: "Autenticación completa con Better Auth: contraseñas, magic links, passkeys y OAuth.",
		description:
			"El sistema de autenticación cubre todos los flujos modernos: registro con email y contraseña, magic links sin contraseña, passkeys con WebAuthn, inicio de sesión con Google y GitHub, y autenticación de dos factores. Todo configurado y listo para producción sin necesidad de integraciones externas adicionales.",
		benefits: [
			"Login con email y contraseña",
			"Magic links (sin contraseña)",
			"Passkeys con WebAuthn",
			"OAuth con Google y GitHub",
			"Autenticación de dos factores (2FA)",
		],
	},
	{
		slug: "multi-tenant",
		icon: "🌍",
		title: "Listo para escalar",
		summary: "Arquitectura multi-tenant con organizaciones, roles y gestión de permisos integrada.",
		description:
			"El modelo de organizaciones permite que cada cliente tenga su propio espacio de trabajo con miembros, roles y configuración independiente. Los roles de administrador, miembro e invitado están predefinidos, y el sistema de invitaciones por email facilita la incorporación de nuevos usuarios a cada organización.",
		benefits: [
			"Organizaciones con slug único",
			"Roles: admin, miembro e invitado",
			"Invitaciones por email",
			"Panel de administración global",
			"Suscripciones por organización",
		],
	},
	{
		slug: "payments",
		icon: "💳",
		title: "Pagos integrados",
		summary: "Suscripciones y pagos únicos con Stripe. Webhooks y gestión de planes listos para usar.",
		description:
			"La integración con Stripe gestiona el ciclo de vida completo de una suscripción: selección de plan, checkout, renovaciones, cancelaciones y reembolsos. Los webhooks están configurados para mantener la base de datos sincronizada con el estado real de cada suscripción en Stripe.",
		benefits: [
			"Planes mensuales y anuales",
			"Pago único (lifetime)",
			"Webhooks de Stripe configurados",
			"Portal de facturación del cliente",
			"Cancelación y reembolso automáticos",
		],
	},
	{
		slug: "emails",
		icon: "📧",
		title: "Emails transaccionales",
		summary: "Plantillas de email con React Email. Compatible con Resend, Postmark, Mailgun y más.",
		description:
			"Las plantillas de email están construidas con React Email, lo que permite diseñarlas como componentes React y previsualizarlas en el navegador antes de enviarlas. El sistema de envío es agnóstico al proveedor: cambia entre Resend, Postmark, Mailgun o Nodemailer con un solo cambio de configuración.",
		benefits: [
			"Plantillas en React Email",
			"Previsualización en navegador",
			"Compatible con múltiples proveedores",
			"Emails de bienvenida, reset y verificación incluidos",
			"Soporte de internacionalización en emails",
		],
	},
	{
		slug: "ai",
		icon: "🤖",
		title: "IA integrada",
		summary: "Conecta modelos de lenguaje con el AI SDK de Vercel. Streams y herramientas incluidas.",
		description:
			"La integración de IA está construida sobre el AI SDK de Vercel, que proporciona una interfaz unificada para conectar con OpenAI, Anthropic, Google y otros proveedores. El chatbot incluido soporta streaming de respuestas y puede ampliarse con herramientas personalizadas para dar al modelo acceso a datos de tu aplicación.",
		benefits: [
			"Compatible con OpenAI, Anthropic y Google",
			"Streaming de respuestas en tiempo real",
			"Chatbot de ejemplo incluido",
			"Sistema de herramientas (tool calling)",
			"Interfaz unificada entre proveedores",
		],
	},
];

export function getFeatureBySlug(slug: string): Feature | undefined {
	return features.find((f) => f.slug === slug);
}
