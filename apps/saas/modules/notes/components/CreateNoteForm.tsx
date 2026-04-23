"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useRouter } from "@shared/hooks/router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createNoteAction } from "../lib/actions";

const formSchema = z.object({
	title: z.string().min(1, "El título es obligatorio").max(100),
	content: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateNoteForm() {
	const router = useRouter();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			content: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ title, content }) => {
		try {
			await createNoteAction({ title, content });

			toastSuccess("Nota creada correctamente");

			form.reset();
			router.refresh();
		} catch {
			toastError("No se pudo crear la nota");
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Título</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Título de la nota" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contenido</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder="Escribe el contenido aquí... (opcional)"
									rows={4}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					variant="primary"
					loading={form.formState.isSubmitting}
				>
					Crear nota
				</Button>
			</form>
		</Form>
	);
}