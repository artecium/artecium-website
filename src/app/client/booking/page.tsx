import { CLIENT_BOOKING_BASE } from "@/config/navigation/booking";
import { redirect } from "next/navigation";

export default function ClientBookingIndexPage() {
  redirect(`${CLIENT_BOOKING_BASE}/dashboard`);
}
