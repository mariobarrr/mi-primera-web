import { getSession } from "@auth/lib/server";

export async function UserGreeting() {
	const session = await getSession();

	if (!session) {
		return null;
	}

	return <p>Hola, {session.user.name}</p>;
}
