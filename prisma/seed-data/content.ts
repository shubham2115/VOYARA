/** DEVELOPMENT SEED DATA ONLY. */
export const categories = [
  ["Hill Stations", "Cool mountain escapes"], ["Beaches", "Sun, sand and sea"], ["Adventure", "Treks, rafting and thrills"],
  ["Religious Tourism", "Sacred journeys and pilgrimages"], ["Honeymoon", "Romantic getaways for couples"],
  ["Family Vacations", "Easy trips for all ages"], ["Wildlife", "Safaris and national parks"],
  ["Heritage and Culture", "Forts, palaces and living traditions"], ["Weekend Getaways", "Short breaks close to the city"],
  ["Luxury Escapes", "Palaces, private islands and premium stays"],
] as const;

export const coupons = [
  { code: "WELCOME10", description: "10% off your first booking", discountType: "PERCENT" as const, value: 10, minAmount: 15000, maxDiscount: 5000, showOnHome: true },
  { code: "FESTIVE2000", description: "Flat ₹2,000 off festive season trips", discountType: "FLAT" as const, value: 2000, minAmount: 20000, maxDiscount: null, showOnHome: true },
  { code: "HONEYMOON15", description: "15% off honeymoon packages", discountType: "PERCENT" as const, value: 15, minAmount: 30000, maxDiscount: 10000, showOnHome: true },
];

export const blogs = [
  { title: "Best Time to Visit Manali: A Month-by-Month Guide", category: "Travel Guides", destination: "Manali", excerpt: "Snow, spring blossoms or monsoon green? Here is how to pick the right month for Manali.", content: "Manali changes character with every season.\n\n## Winter (December–February)\nSnow covers Solang Valley and the town turns into a white postcard. Expect sub-zero nights.\n\n## Summer (March–June)\nPleasant days make this the busiest season for sightseeing and adventure sports.\n\n## Monsoon (July–September)\nLandslides can affect roads, so travel with flexible plans.\n\n## Autumn (October–November)\nClear skies and crisp air — ideal for photography." },
  { title: "7 Unmissable Experiences in Kerala Backwaters", category: "Inspiration", destination: "Alleppey", excerpt: "Beyond the houseboat: village walks, toddy shops, and sunrise canoe rides.", content: "Kerala's backwaters are more than a houseboat cruise.\n\n1. Sunrise canoe ride through narrow canals.\n2. Village walk in Kuttanad.\n3. Coir-making demonstration.\n4. Karimeen pollichathu at a toddy shop.\n5. Kathakali performance in Kochi.\n6. Sunset at Marari beach.\n7. A traditional sadya on banana leaf." },
  { title: "First-Timer's Guide to the Golden Triangle", category: "Travel Guides", destination: "Agra", excerpt: "Delhi, Agra and Jaipur: how many days, what to book, and what to skip.", content: "Five days is the sweet spot for the Golden Triangle.\n\n## Day 1–2: Delhi\nOld Delhi's food lanes, Humayun's Tomb and Lutyens' Delhi.\n\n## Day 3: Agra\nBook Taj Mahal sunrise tickets in advance; Fridays are closed.\n\n## Day 4–5: Jaipur\nAmber Fort early morning, bazaars in the evening." },
  { title: "Meghalaya on a Budget: Root Bridges, Caves and Cafes", category: "Budget Travel", destination: "Cherrapunji", excerpt: "How to experience the Abode of Clouds without overspending.", content: "Shared taxis from Shillong to Sohra cost a fraction of private cabs.\n\n- Stay in Mawlynnong homestays.\n- Visit Dawki on a weekday.\n- Carry cash: ATMs thin out beyond Shillong." },
];

export const testimonials = [
  { name: "Ananya Rao", city: "Bengaluru", rating: 5, title: "Seamless honeymoon", body: "Our Kashmir honeymoon was flawlessly planned — the houseboat night was a dream and the driver was wonderful." },
  { name: "Rohit Mehra", city: "Mumbai", rating: 5, title: "Great value Goa trip", body: "Booked the Goa beach break for six friends. Clear pricing, quick responses on WhatsApp, zero hassle." },
  { name: "Priya Nair", city: "Pune", rating: 4, title: "Family friendly Rajasthan", body: "The heritage circuit had the right balance of sightseeing and rest for our parents and kids." },
  { name: "Vikram Singh", city: "Delhi", rating: 5, title: "Spiritual and smooth", body: "The Varanasi–Ayodhya darshan assistance saved us hours of queues. Highly recommended." },
];

export const settings: Record<string, unknown> = {
  "site.contact": { phone: "+91 99999 99999", email: "hello@voyara.example", address: "Connaught Place, New Delhi 110001", whatsapp: "919999999999" },
  "site.hero": { heading: "Discover India, One Journey at a Time", subtitle: "Handcrafted journeys across India's mountains, coasts, palaces and sacred cities — planned by local experts, priced transparently." },
  "site.whyUs": [
    { title: "Local Experts", text: "Itineraries planned by specialists who live in the destinations." },
    { title: "Transparent Pricing", text: "No hidden charges. Every inclusion and exclusion is listed upfront." },
    { title: "24×7 Trip Support", text: "A real person on call or WhatsApp throughout your journey." },
    { title: "Flexible Customisation", text: "Change hotels, days and activities to match your style and budget." },
  ],
  "site.faq": [
    { q: "How do I book a package?", a: "Click “Book This Package”, submit your details, and our team will send you a quotation within a few hours." },
    { q: "Can I customise a trip?", a: "Absolutely. Use the Customize Trip form and tell us your dates, budget and interests." },
    { q: "What payment methods are accepted?", a: "UPI, cards and net banking through Razorpay, plus bank transfer for larger bookings." },
    { q: "What is the cancellation policy?", a: "Free cancellation up to 15 days before departure; see our Cancellation and Refund Policy for details." },
    { q: "Do you arrange permits?", a: "Yes. We arrange Inner Line Permits for Arunachal and Lakshadweep entry permits." },
  ],
  "site.about": { story: "Voyara was founded to make domestic travel in India feel effortless and personal. From weekend hill escapes to month-long cultural journeys, our team designs trips that respect local communities and your time." },
};
