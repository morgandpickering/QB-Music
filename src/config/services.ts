import type { PlateKind } from '@/lib/products/types';

/**
 * Lessons, repairs, pro audio, and the people who do them.
 *
 * EVERYTHING HERE NEEDS CONFIRMING WITH THE SHOP before launch. The lists below
 * are what a music store of this kind typically offers, written so they can be
 * corrected quickly — but the site's copy is careful never to *promise* a
 * specific lesson or service: it says "ask about" rather than "we offer", until
 * someone at Quattlebaum has confirmed the list.
 *
 * `staff` and `instructors` start empty on purpose. Inventing a named person
 * with a biography would be worse than showing nothing, so those sections do
 * not render until real people are added.
 */

export interface LessonSubject {
  name: string;
  plate: PlateKind;
  note: string;
  /** Flip to true once the shop confirms this is taught. */
  confirmed: boolean;
}

export interface Instructor {
  name: string;
  instruments: string;
  bio: string;
  experience?: string;
  availability?: string;
  photo: string | null;
}

export interface StaffMember {
  name: string;
  /** As listed on the shop's own site. */
  role: string;
  /**
   * Optional on purpose. These are real people; a biography has to come from
   * them, not be written for them. The card reads fine without one.
   */
  bio?: string;
  photo: string | null;
  /** True for anyone who teaches, so the Lessons page can list them. */
  teaches?: boolean;
}

export interface ServiceItem {
  name: string;
  detail: string;
  confirmed: boolean;
}

export const lessonSubjects: LessonSubject[] = [
  { name: 'Guitar', plate: 'electric-guitar', note: 'Electric and acoustic, from first chords up.', confirmed: false },
  { name: 'Bass', plate: 'bass', note: 'Getting solid before getting fast.', confirmed: false },
  { name: 'Piano', plate: 'keyboard', note: 'Classical grounding or playing by ear.', confirmed: false },
  { name: 'Drums', plate: 'drums', note: 'Time, independence, and how to not annoy the band.', confirmed: false },
  { name: 'Voice', plate: 'microphone', note: 'Range, control, and singing without wrecking it.', confirmed: false },
  { name: 'Strings', plate: 'band', note: 'Violin, viola, and cello, from the first open string.', confirmed: false },
  { name: 'Band instruments', plate: 'band', note: 'Help with what the school handed you.', confirmed: false },
];

/** Add real instructors here and the section appears. */
export const instructors: Instructor[] = [];

/**
 * The team. Names, roles, and photographs are taken from Quattlebaum's own
 * site, so they are verified — biographies are not, and are left blank until
 * each person supplies one.
 */
export const staff: StaffMember[] = [
  {
    name: 'Bobby Wright',
    role: 'Owner',
    photo: '/photos/team/bobby-wright.png',
  },
  {
    name: 'Caleb Henry',
    role: 'Repairs & sales',
    photo: '/photos/team/caleb-henry.png',
  },
  {
    name: 'Owen Rinner',
    role: 'Instructor',
    photo: '/photos/team/owen-rinner.png',
    teaches: true,
  },
  {
    name: 'Sarah Grace Knabe',
    role: 'Instructor',
    photo: '/photos/team/sarah-grace-knabe.png',
    teaches: true,
  },
  {
    name: 'Amon Smith',
    role: 'Instructor',
    photo: '/photos/team/amon-smith.png',
    teaches: true,
  },
  {
    name: 'Alyssa Winner',
    role: 'Instructor & sales',
    photo: '/photos/team/alyssa-winner.png',
    teaches: true,
  },
  {
    name: 'Lilli Barden',
    role: 'Media, sales & repairs',
    photo: '/photos/team/lilli-barden.png',
  },
  {
    name: 'William Baker',
    role: 'Instructor',
    photo: '/photos/team/william-baker.png',
    teaches: true,
  },
];

export const repairServices: ServiceItem[] = [
  { name: 'Guitar and bass setups', detail: 'Action, intonation, relief, and a proper fret level if it needs one.', confirmed: false },
  { name: 'Fretwork', detail: 'Dressing, levelling, partial and full refrets.', confirmed: false },
  { name: 'Electronics', detail: 'Pickups, pots, switches, jacks, and the wiring nobody wants to touch.', confirmed: false },
  { name: 'Band instrument service', detail: 'Pads, corks, dents, valve work, and chemical cleaning.', confirmed: false },
  { name: 'Amplifier repair', detail: 'Tubes, biasing, filter caps, noisy jacks, and dead channels.', confirmed: false },
  { name: 'Neck adjustments', detail: 'Truss rod work, and the seasonal move a neck makes every year.', confirmed: false },
  { name: 'Pickup installation', detail: 'Acoustic pickups, replacement magnets, and the wiring behind them.', confirmed: false },
  { name: 'Orchestral instrument service', detail: 'Bridges fitted and cut, sound posts, pegs, and bow rehairing.', confirmed: false },
  { name: 'Restringing and maintenance', detail: 'While you wait, most of the time.', confirmed: false },
];

export const proAudioStages = [
  {
    title: 'Evaluate',
    summary: 'We come and listen to the room.',
    detail:
      'Before anything is specified we stand in the space, hear how it behaves, and find out who has to run it. A hard-surfaced fellowship hall and a carpeted sanctuary the same size need completely different answers, and no amount of catalogue browsing will tell you which.',
  },
  {
    title: 'Design',
    summary: 'A system for that room and those people.',
    detail:
      'Coverage worked out for where people actually sit. Enough headroom that nothing is run flat out. Controls a volunteer can learn in an afternoon, because the person at the desk on a Sunday morning is usually not an engineer.',
  },
  {
    title: 'Install',
    summary: 'Rigged, wired, tuned, and labelled.',
    detail:
      'Hung and aimed properly, cable runs dressed and marked, gain structure set, and the system tuned to the room rather than to a graph. Everything labelled so the next person can follow it.',
  },
  {
    title: 'Support',
    summary: 'We do not disappear afterwards.',
    detail:
      'Training for whoever runs it, written notes for the desk, and a number to call when something stops working the week before Easter. We are twenty minutes away, not a support queue.',
  },
] as const;

export const proAudioClients = [
  'Churches',
  'Schools',
  'Auditoriums',
  'Venues',
  'Businesses',
  'Performance spaces',
];
