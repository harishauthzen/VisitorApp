import dotenv from 'dotenv';
dotenv.config();

const { default: AppDataSource } = await import('./data-source.js');
import { EventEntity } from './events/event.entity.js';
import { EventPass } from './events/event-pass.entity.js';

type SeedPass = {
  name: string;
  description: string;
  price: number;
  totalSlots: number;
};

type SeedEvent = {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  passes: SeedPass[];
};

const seedEvents: SeedEvent[] = [
  {
    name: 'Future Forward Technology Summit',
    description: 'A two-day conference for builders and technology leaders, with practical sessions on AI, cloud platforms, cybersecurity, and responsible product design.',
    location: 'Bengaluru International Exhibition Centre, Bengaluru',
    startDate: '2026-12-05T09:00:00+05:30',
    endDate: '2026-12-06T18:00:00+05:30',
    passes: [
      { name: 'Summit Day Pass', description: 'One day of keynote talks and breakout sessions; conference lunch, refreshments, and digital session notes included.', price: 4999, totalSlots: 300 },
      { name: 'Full Summit Pass', description: 'Access to both conference days, all keynotes and workshops, lunch and refreshments each day, plus the attendee networking app.', price: 8999, totalSlots: 180 },
      { name: 'Executive Pass', description: 'Full summit access, reserved front-row seating, speaker meet-and-greet, executive networking lounge, both days of meals, and post-event recordings.', price: 14999, totalSlots: 60 },
    ],
  },
  {
    name: 'Indie Sound Festival',
    description: 'An outdoor evening of independent Indian music across three stages, featuring emerging artists, food trucks, and a dedicated quiet zone.',
    location: 'Mahalaxmi Racecourse, Mumbai',
    startDate: '2026-12-19T16:00:00+05:30',
    endDate: '2026-12-19T23:00:00+05:30',
    passes: [
      { name: 'General Entry', description: 'Festival grounds and all three music stages; access to water refill points and food truck areas.', price: 999, totalSlots: 1200 },
      { name: 'Golden Circle', description: 'General entry plus a closer stage-viewing area, a welcome drink, dedicated entry lane, and a reusable festival cup.', price: 1999, totalSlots: 400 },
      { name: 'Backstage Social', description: 'Golden Circle access, artist Q&A session, festival lounge, two meal credits, dedicated parking, and a limited-edition merchandise pack.', price: 4999, totalSlots: 100 },
    ],
  },
  {
    name: 'Flavours of India Food Fair',
    description: 'A family-friendly celebration of regional Indian cooking with chef demonstrations, tasting counters, local producers, and live culinary workshops.',
    location: 'HITEX Exhibition Centre, Hyderabad',
    startDate: '2027-01-16T11:00:00+05:30',
    endDate: '2027-01-17T21:00:00+05:30',
    passes: [
      { name: 'Tasting Entry', description: 'Entry for one day, a curated sampler of five regional dishes, chef-stage access, and a printed food trail map.', price: 399, totalSlots: 900 },
      { name: 'Foodie Explorer', description: 'One-day entry, twelve tasting tokens, one hands-on cooking demonstration, a welcome beverage, and priority access to tasting counters.', price: 899, totalSlots: 450 },
      { name: 'Chef\'s Table', description: 'Two-day entry, unlimited standard tastings, a small-group chef masterclass, reserved tasting-table seating, and a regional ingredients hamper.', price: 1999, totalSlots: 120 },
    ],
  },
  {
    name: 'Reset & Rise Wellness Weekend',
    description: 'A restorative weekend of guided yoga, breathwork, mindful movement, and expert sessions on building sustainable everyday wellbeing habits.',
    location: 'Oxford Golf Resort, Pune',
    startDate: '2027-02-06T07:00:00+05:30',
    endDate: '2027-02-07T17:00:00+05:30',
    passes: [
      { name: 'Day Reset', description: 'One day of group yoga, breathwork, and wellness talks; yoga mat, herbal tea, and changing-room access included.', price: 499, totalSlots: 250 },
      { name: 'Weekend Recharge', description: 'Both days of group sessions, a wellness journal, healthy lunch each day, guided meditation, and access to the relaxation garden.', price: 1299, totalSlots: 150 },
      { name: 'Private Retreat', description: 'Weekend access, one small-group yoga class, personal wellness consultation, all meals, premium retreat kit, and reserved quiet-zone seating.', price: 2499, totalSlots: 40 },
    ],
  },
  {
    name: 'City Lines Contemporary Art Week',
    description: 'A contemporary art exhibition bringing together regional artists, guided gallery walks, live studio demonstrations, and participatory installations.',
    location: 'National Gallery of Modern Art, Bengaluru',
    startDate: '2027-03-13T10:00:00+05:30',
    endDate: '2027-03-14T19:00:00+05:30',
    passes: [
      { name: 'Gallery Entry', description: 'One-day exhibition entry, access to public installations, and a printed guide to participating artists.', price: 299, totalSlots: 500 },
      { name: 'Curious Collector', description: 'Two-day entry, one curator-led gallery walk, access to artist talks, a gallery notebook, and priority booking for demonstrations.', price: 999, totalSlots: 180 },
      { name: 'Studio Circle', description: 'Two-day entry, small-group artist studio visit, hands-on art workshop with materials, opening reception, and a signed exhibition catalogue.', price: 2499, totalSlots: 50 },
    ],
  },
  {
    name: 'Build Together Startup Forum',
    description: 'A practical forum for founders, early teams, and investors, featuring product-building workshops, founder stories, pitch sessions, and curated networking.',
    location: 'Yashobhoomi Convention Centre, New Delhi',
    startDate: '2027-04-10T09:00:00+05:30',
    endDate: '2027-04-10T20:00:00+05:30',
    passes: [
      { name: 'Community Pass', description: 'All public talks and panels, exhibition floor access, coffee breaks, and the forum networking directory.', price: 799, totalSlots: 600 },
      { name: 'Builder Pass', description: 'Community access plus two practical workshops, lunch, startup showcase access, and reserved seating for founder sessions.', price: 2499, totalSlots: 250 },
      { name: 'Founder & Investor Pass', description: 'Builder access, curated investor-founder roundtables, pitch-room access, hosted networking reception, and a post-event contact list.', price: 4999, totalSlots: 80 },
    ],
  },
  {
    name: 'Run the Lakes 10K & Fitness Day',
    description: 'A timed 10K community run and fitness festival with warm-up coaching, accessible route support, recovery stations, and family activities.',
    location: 'Hussain Sagar Lakefront, Hyderabad',
    startDate: '2027-05-02T05:30:00+05:30',
    endDate: '2027-05-02T12:00:00+05:30',
    passes: [
      { name: '5K Fun Run', description: '5K route entry, participant bib, timing result, water stations, finish-line fruit, and digital finisher certificate.', price: 499, totalSlots: 700 },
      { name: '10K Timed Run', description: 'Timed 10K entry, race bib and chip, official result, event T-shirt, hydration support, recovery snack, and finisher medal.', price: 1299, totalSlots: 450 },
      { name: 'Runner Plus', description: 'Timed 10K entry, premium race kit, pre-race coaching clinic, priority start corral, post-run recovery area, breakfast, and event photos.', price: 2999, totalSlots: 100 },
    ],
  },
  {
    name: 'Light & Lens Photography Walk',
    description: 'A guided street and portrait photography experience led by working photographers, with small groups, practical assignments, and image reviews.',
    location: 'Fort Kochi Heritage District, Kochi',
    startDate: '2027-05-22T06:00:00+05:30',
    endDate: '2027-05-22T17:00:00+05:30',
    passes: [
      { name: 'Photo Walk', description: 'Guided morning photo walk, route map, bottled water, and access to the closing image-sharing session; bring your own camera.', price: 899, totalSlots: 80 },
      { name: 'Workshop Pass', description: 'Photo walk plus composition and natural-light workshop, printed field guide, lunch, and a small-group portfolio review.', price: 2499, totalSlots: 40 },
      { name: 'Mentor Session', description: 'Workshop access, one-to-one portfolio feedback, hands-on portrait lighting practice, loaner reflector kit, and a signed photo zine.', price: 5999, totalSlots: 12 },
    ],
  },
  {
    name: 'Stories After Hours Literature Festival',
    description: 'A weekend gathering for readers and writers, with author conversations, poetry readings, book launches, writing workshops, and an independent book market.',
    location: 'Jaipur Literature House, Jaipur',
    startDate: '2027-06-12T10:00:00+05:30',
    endDate: '2027-06-13T20:00:00+05:30',
    passes: [
      { name: 'Reader Day Pass', description: 'One-day author sessions, poetry readings, book market access, and a festival reading-list booklet.', price: 399, totalSlots: 500 },
      { name: 'Weekend Reader', description: 'Both festival days, one writing workshop, reserved session seating, a book voucher, and access to the evening readings.', price: 999, totalSlots: 220 },
      { name: 'Author Circle', description: 'Weekend access, small-group author breakfast, two writing workshops, signed festival anthology, and priority seating at headline conversations.', price: 1999, totalSlots: 60 },
    ],
  },
  {
    name: 'Green Neighbourhoods Action Day',
    description: 'A hands-on community sustainability event with urban gardening, repair and reuse workshops, local climate projects, and a neighbourhood clean-up.',
    location: 'Cubbon Park, Bengaluru',
    startDate: '2027-07-03T08:00:00+05:30',
    endDate: '2027-07-03T16:00:00+05:30',
    passes: [
      { name: 'Community Entry', description: 'Access to public talks, community project stalls, refill points, and the neighbourhood clean-up; reusable gloves provided.', price: 249, totalSlots: 500 },
      { name: 'Hands-on Pass', description: 'Community entry plus a gardening workshop, seed-starting kit, repair-cafe booking, lunch, and a reusable water bottle.', price: 749, totalSlots: 180 },
      { name: 'Impact Partner', description: 'Hands-on access, small-group expert roundtable, premium native-seed kit, project mentorship session, lunch, and recognition in the event impact report.', price: 1499, totalSlots: 50 },
    ],
  },
];

async function seedSampleEvents() {
  await AppDataSource.initialize();

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      const eventRepository = manager.getRepository(EventEntity);
      const passRepository = manager.getRepository(EventPass);
      let seededEvents = 0;
      let seededPasses = 0;
      let skippedEvents = 0;

      for (const seed of seedEvents) {
        const existingEvent = await eventRepository.findOne({
          where: { name: seed.name },
        });
        if (existingEvent) {
          skippedEvents += 1;
          continue;
        }

        const event = await eventRepository.save(eventRepository.create({
          name: seed.name,
          description: seed.description,
          location: seed.location,
          startDate: new Date(seed.startDate),
          endDate: new Date(seed.endDate),
          isActive: true,
        }));

        const passes = seed.passes.map((pass) => passRepository.create({
          ...pass,
          soldSlots: 0,
          isActive: true,
          eventId: event.id,
          event,
        }));
        await passRepository.save(passes);
        seededEvents += 1;
        seededPasses += passes.length;
      }

      return { seededEvents, seededPasses, skippedEvents };
    });

    console.info(
      `Seeded ${result.seededEvents} events and ${result.seededPasses} passes; skipped ${result.skippedEvents} existing events.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

seedSampleEvents().catch((error: unknown) => {
  console.error('Event seed failed:', error);
  process.exitCode = 1;
});
