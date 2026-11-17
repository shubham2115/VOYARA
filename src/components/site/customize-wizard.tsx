"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type V = {
  departureCity: string; destinationName: string; travelDate: string; returnDate: string;
  adults: number; children: number; rooms: number; budgetPerPerson: number;
  hotelPreference: string; transportPreference: string; interests: string[]; message: string;
  name: string; email: string; phone: string;
};

const INTERESTS = ["Adventure", "Beaches", "Culture & Heritage", "Food", "Honeymoon", "Nature & Wildlife", "Pilgrimage", "Shopping", "Wellness & Yoga", "Photography"];
const STEPS = ["Trip", "Travellers", "Preferences", "Contact", "Review"];
const STEP_FIELDS: (keyof V)[][] = [["departureCity", "destinationName", "travelDate"], ["adults", "children", "rooms", "budgetPerPerson"], [], ["name", "email", "phone"], []];

export function CustomizeWizard({ destinations, defaults, user }: {
  destinations: string[]; defaults: { destinationName?: string; message?: string }; user?: { name: string; email: string } | null;
}) {
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState<string | null>(null);
  const { register, trigger, getValues, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<V>({
    defaultValues: { adults: 2, children: 0, rooms: 1, budgetPerPerson: 25000, hotelPreference: "Deluxe", transportPreference: "Private cab", interests: [], destinationName: defaults.destinationName ?? "", message: defaults.message ?? "", name: user?.name ?? "", email: user?.email ?? "" },
  });
  const interests = watch("interests");
  const req = { required: "Required" };

  async function next() { if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1); }
  const toggle = (i: string) => setValue("interests", interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i]);

  async function submit(v: V) {
    const res = await fetch("/api/enquiries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, source: "CUSTOM_TRIP", adults: +v.adults, children: +v.children, rooms: +v.rooms, budgetPerPerson: +v.budgetPerPerson }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return void toast.error(json?.error?.message ?? "Could not submit. Please check your details.");
    setDone(json.data.reference);
  }

  if (done) return (
    <div className="py-10 text-center" role="status">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
      <h2 className="mt-4 text-3xl">Request received!</h2>
      <p className="mt-2 text-navy-400">Reference <b>{done}</b>. Our experts will craft your itinerary and contact you shortly.</p>
    </div>
  );

  const v = getValues();
  const review: [string, string][] = [
    ["From → To", `${v.departureCity} → ${v.destinationName}`], ["Dates", `${v.travelDate || "Flexible"}${v.returnDate ? ` to ${v.returnDate}` : ""}`],
    ["Travellers", `${v.adults} adults, ${v.children} children, ${v.rooms} room(s)`], ["Budget", `₹${Number(v.budgetPerPerson).toLocaleString("en-IN")} per person`],
    ["Hotel / Transport", `${v.hotelPreference} · ${v.transportPreference}`], ["Interests", v.interests.join(", ") || "—"],
    ["Requirements", v.message || "—"], ["Contact", `${v.name} · ${v.email} · ${v.phone}`],
  ];

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", i <= step ? "bg-navy text-white" : "bg-navy-100 text-navy-400")} aria-current={i === step ? "step" : undefined}>{i + 1}</span>
            <span className="hidden text-sm sm:block">{s}</span>
            {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1", i < step ? "bg-navy" : "bg-navy-100")} />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting city" error={errors.departureCity?.message}><Input {...register("departureCity", req)} placeholder="e.g. Mumbai" /></Field>
          <Field label="Destination" error={errors.destinationName?.message}><Input list="dest-list" {...register("destinationName", req)} placeholder="e.g. Manali" /><datalist id="dest-list">{destinations.map((d) => <option key={d} value={d} />)}</datalist></Field>
          <Field label="Preferred start date" error={errors.travelDate?.message}><Input type="date" min={new Date().toISOString().slice(0, 10)} {...register("travelDate", req)} /></Field>
          <Field label="Return date (optional)"><Input type="date" {...register("returnDate")} /></Field>
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adults" error={errors.adults?.message}><Input type="number" min={1} max={30} {...register("adults", { required: "Required", min: { value: 1, message: "At least 1" } })} /></Field>
          <Field label="Children" error={errors.children?.message}><Input type="number" min={0} max={20} {...register("children", { min: 0 })} /></Field>
          <Field label="Rooms" error={errors.rooms?.message}><Input type="number" min={1} max={15} {...register("rooms", { required: "Required", min: 1 })} /></Field>
          <Field label="Budget per person (₹)" error={errors.budgetPerPerson?.message}><Input type="number" min={1000} step={1000} {...register("budgetPerPerson", { required: "Required", min: { value: 1000, message: "Min ₹1,000" } })} /></Field>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hotel preference"><Select {...register("hotelPreference")}>{["Budget", "Standard", "Deluxe", "Luxury"].map((h) => <option key={h}>{h}</option>)}</Select></Field>
            <Field label="Transport preference"><Select {...register("transportPreference")}>{["Private cab", "Self-drive", "Train", "Flight + cab", "Volvo / bus"].map((h) => <option key={h}>{h}</option>)}</Select></Field>
          </div>
          <fieldset><legend className="mb-2 text-sm font-medium">Travel interests</legend>
            <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <button type="button" key={i} aria-pressed={interests.includes(i)} onClick={() => toggle(i)} className={cn("rounded-full border px-4 py-1.5 text-sm transition", interests.includes(i) ? "border-navy bg-navy text-white" : "border-navy-200 bg-white hover:border-navy")}>{i}</button>)}</div></fieldset>
          <Field label="Additional requirements"><Textarea rows={4} {...register("message")} placeholder="Dietary needs, celebrations, accessibility, must-see places…" /></Field>
        </div>
      )}
      {step === 3 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message} className="sm:col-span-2"><Input {...register("name", { ...req, minLength: { value: 2, message: "Too short" } })} /></Field>
          <Field label="Email" error={errors.email?.message}><Input type="email" {...register("email", { ...req, pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })} /></Field>
          <Field label="Phone" error={errors.phone?.message}><Input type="tel" {...register("phone", { ...req, pattern: { value: /^[+]?[0-9\s-]{10,15}$/, message: "Invalid phone" } })} /></Field>
        </div>
      )}
      {step === 4 && (
        <div><h2 className="mb-4 text-2xl">Review your trip</h2>
          <dl className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">{review.map(([k, val]) => <div key={k} className="grid gap-1 px-5 py-3 sm:grid-cols-3"><dt className="text-sm text-navy-400">{k}</dt><dd className="font-medium sm:col-span-2">{val}</dd></div>)}</dl></div>
      )}

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}><ChevronLeft className="h-4 w-4" /> Back</Button>
        {step < STEPS.length - 1
          ? <Button type="button" onClick={next}>Continue</Button>
          : <Button type="submit" variant="gold" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit request"}</Button>}
      </div>
    </form>
  );
}
