export type HoppyFace = "wink" | "cool" | "angry";

export type Testimonial = {
  name: string;
  handle: string;
  date: string;
  posted: string;
  comment: string;
  tint: string;
  hoppy: HoppyFace;
  tilt: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Cole Crown Adrian",
    handle: "DamolaAderibig1",
    date: "Sep 24, 2026",
    posted: "2026-09-24",
    comment:
      "Wish to be no 1 again because I had a lot of clicks, still getting them at no 20 😂",
    tint: "tint-bubblegum",
    hoppy: "wink",
    tilt: "-rotate-1",
  },
  {
    name: "The Cozy Dev",
    handle: "The_CozyDev",
    date: "Sep 20, 2026",
    posted: "2026-09-20",
    comment: [
      "I've listed two of my apps on Hopup.lol now and they've had nearly 1,000 clicks combined, which has genuinely surprised me.",
      "Adding the listings was incredibly easy, everything feels simple and straightforward, and there's something weirdly addictive about watching the leaderboard and wondering whether someone's about to outbid you for one of the top spots. It turns promotion into something that actually feels fun rather than another boring marketing task.",
      "I also have to give a special mention to the founder. She's been incredibly kind and supportive towards me over on X, and that means a lot when you're an indie dev trying to put your work out into the world.",
      "Hopup has quickly become one of those platforms I'm genuinely happy to support. Simple idea, really well executed, and most importantly for me, it's actually sending people to my apps.",
    ].join("\n"),
    tint: "tint-orange",
    hoppy: "wink",
    tilt: "-rotate-1",
  },
  {
    name: "Nick | Afterimage",
    handle: "AfterimageDev",
    date: "Sep 22, 2026",
    posted: "2026-09-22",
    comment:
      "Was very easy getting listed, and I'm getting good traffic (and vertigo) from being high up the board!",
    tint: "tint-butter",
    hoppy: "wink",
    tilt: "rotate-1",
  },
  {
    name: "Parth Sharma",
    handle: "Ksparth12",
    date: "Sep 21, 2026",
    posted: "2026-09-21",
    comment:
      "Listed Wensity UI and Rune mostly for the backlinks, but they're actually getting clicks too 😂 Aloha is crazy for building something this simple and making it work so well. Love what she's doing with HopUp.",
    tint: "tint-grape",
    hoppy: "cool",
    tilt: "rotate-2",
  },
  {
    name: "Jonathan Lis",
    handle: "ZenModeJon",
    date: "Sep 07, 2026",
    posted: "2026-09-07",
    comment:
      "Ui looks cool - this will definitely do well. I guess the important part for potential customers is knowing where you'll go with the Stanley cup and how many people might potentially see it on a day to day basis.",
    tint: "tint-butter",
    hoppy: "angry",
    tilt: "-rotate-2",
  },
  {
    name: "anna melnyk",
    handle: "annameln27",
    date: "Sep 05, 2026",
    posted: "2026-09-05",
    comment:
      "Thank you so much 😊 This looks very cool! I am going to check it out it looks like it would be very useful 🙏",
    tint: "tint-mint",
    hoppy: "cool",
    tilt: "rotate-1",
  },
  {
    name: "Adeel",
    handle: "heyadeel",
    date: "Aug 27, 2026",
    posted: "2026-08-27",
    comment: "Love how clean it looks. Good luck 🙌",
    tint: "tint-grape",
    hoppy: "cool",
    tilt: "rotate-2",
  },
  {
    name: "The Cozy Dev",
    handle: "The_CozyDev",
    date: "Sep 02, 2026",
    posted: "2026-09-02",
    comment: [
      "This is awesome. Creating a little bit of hype for people's work is a wonderful thing.",
      "It was pretty easy to sign up and pay to be honest. Very smooth service.",
      "And the clicks on it already. Clearly with every penny paid.",
    ].join("\n"),
    tint: "tint-mint",
    hoppy: "cool",
    tilt: "rotate-1",
  },
  {
    name: "Dan",
    handle: "doja_dan",
    date: "Aug 29, 2026",
    posted: "2026-08-29",
    comment: "I'm running out of budget for tonight but I claimed a spot at least!",
    tint: "tint-mint",
    hoppy: "wink",
    tilt: "rotate-1",
  },
  {
    name: "Vlad Arbatov",
    handle: "vladzima",
    date: "Aug 25, 2026",
    posted: "2026-08-25",
    comment:
      "I will buy and brand anything Aloha says. She is definitely not holding me hostage or anything.",
    tint: "tint-bubblegum",
    hoppy: "wink",
    tilt: "-rotate-1",
  },
  {
    name: "Harsh",
    handle: "HarshPatel502",
    date: "Sep 14, 2026",
    posted: "2026-09-14",
    comment:
      "Aloha is exceptionally good at marketing. You won’t regret signing up for HopUp.lol it’s all worth it. Get started with HopUp today and get the attention your product deserves!",
    tint: "tint-orange",
    hoppy: "angry",
    tilt: "rotate-1",
  },
];

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;

const HANDLE_BY_KEY = new Map(
  TESTIMONIALS.map((item) => [item.handle.toLowerCase(), item.handle] as const)
);

export function normalizeXHandle(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

export function uniqueTestimonialHandles(): string[] {
  return [...new Set(TESTIMONIALS.map((item) => item.handle))];
}

export function canonicalTestimonialHandle(raw: string): string | null {
  const handle = normalizeXHandle(raw);
  if (!HANDLE.test(handle)) return null;
  return HANDLE_BY_KEY.get(handle.toLowerCase()) ?? null;
}

export function xAvatarPath(handle: string): string {
  return `/api/x-avatar?h=${encodeURIComponent(handle)}`;
}
