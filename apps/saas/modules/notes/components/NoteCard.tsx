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
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { useRouter } from "@shared/hooks/router";
import { PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { deleteNoteAction, updateNoteAction } from "../lib/actions";

const formSchema = z.object({
	title: z.string().min(1, "El título es obligatorio").max(100),
	content: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NoteCardProps {
	id: string;
	title: string;
	content: string | null;
	createdAt: Date;
}

export function NoteCard({ id, title, content, createdAt }: NoteCardProps) {
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const [isEditing, setIsEditing] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title,
			content: content ?? "",
		},
	});

	const onSubmitEdit = form.handleSubmit(async (values) => {
		try {
			await updateNoteAction({ id, ...values });
			toastSuccess("Nota actualizada");
			setIsEditing(false);
			router.refresh();
		} catch {
			toastError("No se pudo actualizar la nota");
		}
	});

	const handleDelete = () => {
		confirm({
			title: "Eliminar nota",
			message: "¿Seguro que quieres eliminar esta nota? Esta acción no se puede deshacer.",
			destructive: true,
			onConfirm: async () => {
				try {
					await deleteNoteAction(id);
					toastSuccess("Nota eliminada");
					router.refresh();
				} catch {
					toastError("No se pudo eliminar la nota");
				}
			},
		});
	};

	if (isEditing) {
		return (
			<li className="rounded-lg border bg-card p-6">
				<Form {...form}>
					<form onSubmit={onSubmitEdit} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Título</FormLabel>
									<FormControl>
										<Input {...field} />
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
										<Textarea {...field} rows={4} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="gap-2 flex">
							<Button
								type="submit"
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								Guardar
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									form.reset();
									setIsEditing(false);
								}}
							>
								<XIcon className="mr-1.5 size-4" />
								Cancelar
							</Button>
						</div>
					</form>
				</Form>
			</li>
		);
	}

	return (
		<li className="rounded-lg border bg-card p-6">
			<div className="gap-2 flex items-start justify-between">
				<h2 className="font-medium text-foreground">{title}</h2>
				<div className="gap-1 flex shrink-0 items-center">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsEditing(true)}
						aria-label="Editar nota"
					>
						<PencilIcon className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleDelete}
						aria-label="Eliminar nota"
					>
						<Trash2Icon className="size-4 text-destructive" />
					</Button>
				</div>
			</div>

			{content && (
				<p className="mt-2 text-sm text-foreground/60">{content}</p>
			)}

			<p className="mt-4 text-xs text-foreground/40">
				{new Date(createdAt).toLocaleDateString("es-ES", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
			</p>
		</li>
	);
}