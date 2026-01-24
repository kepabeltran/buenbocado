import { redirect } from "next/navigation";

export default async function PickupRedirect(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/ticket/${id}`);
}
