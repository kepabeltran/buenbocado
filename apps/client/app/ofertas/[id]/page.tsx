import { redirect } from "next/navigation";

export default function OfertaAlias({ params }: { params: { id: string } }) {
  redirect(`/offers/${params.id}`);
}
