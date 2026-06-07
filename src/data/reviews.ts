import type { Review } from './types'
import { usersById } from './users'
import { img } from '../lib/img'

let counter = 0

function review(
  businessId: string,
  authorId: string,
  rating: number,
  date: string,
  body: string,
  opts: Partial<Review> = {},
): Review {
  const u = usersById[authorId]
  counter += 1
  return {
    id: `rev-${counter}`,
    businessId,
    authorId,
    authorName: u.name,
    authorAvatar: u.avatar,
    authorLevel: u.level,
    rating,
    date,
    body,
    photos: [],
    likes: 0,
    ...opts,
  }
}

export const seedReviews: Review[] = [
  // The Copper Whisk
  review(
    'copper-whisk',
    'u1',
    5,
    '2 weeks ago',
    'Genuinely one of the best meals I’ve had in London this year. The dry-aged ribeye was faultless and our waiter knew the wine list inside out. The room hums but you can still hear yourself talk.',
    {
      title: 'A flawless Borough Market dinner',
      food: 5,
      service: 5,
      ambience: 5,
      value: 4,
      visitType: 'Dinner',
      likes: 64,
      photos: [img('steak,food', 5001), img('restaurant,interior', 5002)],
    },
  ),
  review(
    'copper-whisk',
    'u4',
    5,
    '1 month ago',
    'Came for the Sunday roast and left a changed man. Duck-fat potatoes, a Yorkshire the size of a hat and gravy you could drink. Book ahead — it was rammed by 1pm.',
    { title: 'Best roast south of the river', food: 5, service: 4, ambience: 5, value: 5, visitType: 'Sunday lunch', likes: 41 },
  ),
  review(
    'copper-whisk',
    'me',
    4,
    '1 month ago',
    'Lovely food and a buzzy room. Knocked a star off only because we waited 20 minutes past our booking for the table. Once seated, the crab crumpet was the highlight.',
    { food: 5, service: 3, ambience: 4, value: 4, visitType: 'Dinner', likes: 12 },
  ),
  review(
    'copper-whisk',
    'u3',
    5,
    '3 months ago',
    'Took my parents for my dad’s birthday and they’re still talking about it. Proper service without being stuffy. The sommelier found us a brilliant English sparkling.',
    { food: 5, service: 5, ambience: 4, value: 4, visitType: 'Celebration', likes: 28 },
  ),

  // Saffron & Sage
  review(
    'saffron-sage',
    'u3',
    5,
    '1 week ago',
    'The black dal alone is worth the trip — 24 hours of cooking and you can taste every one of them. Order more than you think you need and a couple of the cardamom martinis.',
    {
      title: 'Spice done with finesse',
      food: 5,
      service: 5,
      ambience: 5,
      value: 5,
      visitType: 'Dinner',
      likes: 53,
      photos: [img('indian,curry', 5101), img('cocktail,drink', 5102)],
    },
  ),
  review(
    'saffron-sage',
    'u6',
    4,
    '3 weeks ago',
    'Fantastic flavours and a brilliant buzz. It does get very loud once it fills up, so not one for a quiet catch-up. The lamb seekh was smoky perfection.',
    { food: 5, service: 4, ambience: 3, value: 4, visitType: 'Dinner', likes: 19 },
  ),
  review(
    'saffron-sage',
    'me',
    5,
    '2 months ago',
    'My new Brick Lane go-to. The butter chicken bao should be illegal. Staff were so warm and didn’t blink when we asked for extra heat.',
    { food: 5, service: 5, ambience: 4, value: 5, visitType: 'Dinner', likes: 22 },
  ),

  // Yuzu
  review(
    'yuzu',
    'u6',
    5,
    '2 weeks ago',
    'A real occasion. Sitting at the counter watching the chefs work is theatre. The o-toro melted and the sake pairing was inspired. Not cheap, but worth every penny.',
    { title: 'World-class omakase', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Omakase', likes: 47, photos: [img('sushi,food', 5201)] },
  ),
  review(
    'yuzu',
    'u1',
    5,
    '2 months ago',
    'Precise, calm and quietly confident. Fourteen seats so it feels personal. Book weeks ahead and go hungry — the 16 courses build beautifully.',
    { food: 5, service: 5, ambience: 4, value: 4, visitType: 'Omakase', likes: 31 },
  ),

  // Dragon Pearl
  review(
    'dragon-pearl',
    'u6',
    5,
    '5 days ago',
    'Trolleys! Actual trolleys! The har gow are some of the best in town and the char siu bao are pillowy clouds. Chaos at the weekend but that’s half the fun.',
    { title: 'Chinatown dim sum done right', food: 5, service: 4, ambience: 4, value: 5, visitType: 'Lunch', likes: 38, photos: [img('dumpling,food', 5301)] },
  ),
  review(
    'dragon-pearl',
    'u2',
    4,
    '1 month ago',
    'Great value and proper Cantonese roasting. Service is brisk to the point of brusque, but you don’t come here for a chat. The roast duck was excellent.',
    { food: 5, service: 3, ambience: 4, value: 5, visitType: 'Lunch', likes: 14 },
  ),
  review(
    'dragon-pearl',
    'u4',
    4,
    '2 months ago',
    'Solid and reliable. Go early to beat the queue. Could do with refreshing the décor but the food more than makes up for it.',
    { food: 4, service: 4, ambience: 3, value: 5, visitType: 'Lunch', likes: 9 },
  ),

  // Trattoria Lupo
  review(
    'trattoria-lupo',
    'u4',
    5,
    '1 week ago',
    'Cacio e pepe exactly as it should be — glossy, peppery, nothing else needed. Pre-theatre set menu is a steal in zone 1. We’ll be back before every show.',
    { title: 'Soho pasta that overdelivers', food: 5, service: 4, ambience: 4, value: 5, visitType: 'Pre-theatre', likes: 26, photos: [img('pasta,food', 5401)] },
  ),
  review(
    'trattoria-lupo',
    'u5',
    4,
    '1 month ago',
    'Cosy and cheerful with a proper wood-fired oven. Tables are a touch close together but the nduja pizza and a carafe of house red sorted that right out.',
    { food: 4, service: 4, ambience: 4, value: 5, visitType: 'Dinner', likes: 11 },
  ),

  // Velvet & Hops
  review(
    'velvet-hops',
    'u2',
    5,
    '3 days ago',
    'My favourite cocktail bar in Soho, no contest. The smoked old fashioned is a ritual and the bartenders actually care what you like. Get there early for a booth.',
    { title: 'Grown-up Soho drinking', food: 4, service: 5, ambience: 5, value: 4, visitType: 'Drinks', likes: 35, photos: [img('cocktail,bar', 5501)] },
  ),
  review(
    'velvet-hops',
    'u5',
    4,
    '3 weeks ago',
    'Gorgeous room and excellent drinks, though it gets packed after 9 and the DJ can drown out conversation. The rhubarb collins is dangerously easy to drink.',
    { food: 4, service: 4, ambience: 5, value: 4, visitType: 'Date night', likes: 18 },
  ),

  // The Curious Kettle
  review(
    'curious-kettle',
    'u5',
    5,
    '4 days ago',
    'The corn fritters are a religious experience and the coffee is genuinely excellent. Plant-filled, sunny and friendly. Weekend queues are real but worth it.',
    { title: 'Portobello brunch perfection', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Brunch', likes: 29, photos: [img('brunch,food', 5601)] },
  ),
  review(
    'curious-kettle',
    'me',
    4,
    '1 month ago',
    'Reliable flat white and lovely staff. Worked here for a couple of hours and nobody hurried me along. Pastries had sold out by 11, so come early.',
    { food: 4, service: 5, ambience: 4, value: 4, visitType: 'Coffee', likes: 7 },
  ),

  // The Alchemist's Arms
  review(
    'alchemists-arms',
    'u4',
    5,
    '6 days ago',
    'A proper pub. Fire roaring, dog asleep by the bar, eight cask lines in great nick. The roast sells out so book. This is what I want from a London local.',
    { title: 'Everything a pub should be', food: 4, service: 5, ambience: 5, value: 5, visitType: 'Sunday lunch', likes: 33 },
  ),
  review(
    'alchemists-arms',
    'u2',
    4,
    '2 months ago',
    'Lovely cask ale and a cracking Scotch egg. Gets very busy on Exmouth Market evenings so expect to stand. No phones policy is a blessing.',
    { food: 4, service: 4, ambience: 5, value: 4, visitType: 'Drinks', likes: 12 },
  ),

  // Brixton Beach Club
  review(
    'brixton-beach',
    'u5',
    4,
    '1 week ago',
    'So much fun in the sun. Frozen margs, a great DJ and that rooftop view. Bottomless brunch is excellent value but service slows when it’s heaving.',
    { title: 'Best rooftop in south London', food: 4, service: 3, ambience: 5, value: 5, visitType: 'Bottomless brunch', likes: 24, photos: [img('rooftop,cocktail', 5701)] },
  ),
  review(
    'brixton-beach',
    'u3',
    4,
    '1 month ago',
    'Came for a hen do and they looked after us brilliantly. Drinks are pricey but the vibe is unbeatable when the sun’s out. Bring a layer for later.',
    { food: 4, service: 4, ambience: 5, value: 4, visitType: 'Group', likes: 15 },
  ),

  // Maison Margaux
  review(
    'maison-margaux',
    'u1',
    5,
    '3 weeks ago',
    'Old-school luxury executed to perfection. The soufflé is textbook and the service is the kind that anticipates your every need. Saving up to go back.',
    { title: 'A special-occasion classic', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Anniversary', likes: 40, photos: [img('finedining,food', 5801)] },
  ),
  review(
    'maison-margaux',
    'u4',
    4,
    '2 months ago',
    'Faultless cooking and a magnificent cheese trolley, though the bill is eye-watering once wine is involved. Dress smart — it’s that kind of room.',
    { food: 5, service: 5, ambience: 5, value: 3, visitType: 'Dinner', likes: 16 },
  ),

  // Bun & Bao
  review(
    'bun-and-bao',
    'me',
    5,
    '5 days ago',
    'Unbeatable value on Rye Lane. The Korean wings are sticky, spicy and dangerously moreish. Tiny space so grab it to go and eat in the sunshine.',
    { title: 'Peckham’s best cheap eat', food: 5, service: 4, ambience: 4, value: 5, visitType: 'Lunch', likes: 21, photos: [img('bao,food', 5901)] },
  ),
  review(
    'bun-and-bao',
    'u6',
    4,
    '1 month ago',
    'Bao are pillowy and the bubble tea is the real deal. Queues at lunch move fast. Would love a couple more seats but that’s street food for you.',
    { food: 5, service: 4, ambience: 3, value: 5, visitType: 'Lunch', likes: 10 },
  ),

  // The Smoky Barrel
  review(
    'smoky-barrel',
    'u2',
    4,
    '2 weeks ago',
    'Brisket was tender and smoky, ribs fell off the bone. Loud and great fun with a group. Service flagged when it got busy but the beer list kept us happy.',
    { title: 'Proper barbecue by the Lock', food: 5, service: 3, ambience: 4, value: 4, visitType: 'Dinner', likes: 17, photos: [img('bbq,ribs', 6001)] },
  ),
  review(
    'smoky-barrel',
    'u4',
    4,
    '2 months ago',
    'Generous portions and a cracking craft selection. Bring a big appetite and don’t wear white. The burnt ends mac is the move.',
    { food: 4, service: 4, ambience: 4, value: 4, visitType: 'Group', likes: 9 },
  ),

  // Olive & Vine
  review(
    'olive-vine',
    'u1',
    5,
    '1 week ago',
    'The baked feta with honey is worth a trip across town. Lovely terrace, charming staff and proper charcoal-grilled souvlaki. A little corner of Greece on Upper Street.',
    { title: 'Sunshine on a plate', food: 5, service: 5, ambience: 5, value: 5, visitType: 'Dinner', likes: 27, photos: [img('greek,food', 6101)] },
  ),
  review(
    'olive-vine',
    'u5',
    4,
    '1 month ago',
    'Great mezze and a lovely buzz. The terrace is a treat in summer. Portions are generous so don’t over-order — though the loukoumades are non-negotiable.',
    { food: 4, service: 4, ambience: 5, value: 4, visitType: 'Dinner', likes: 12 },
  ),

  // Grind House Coffee
  review(
    'grind-house',
    'u2',
    5,
    '4 days ago',
    'Best coffee on Redchurch Street and it’s not close. The cardamom bun is the perfect partner. Small but perfectly formed — proper craft.',
    { title: 'Shoreditch caffeine HQ', food: 4, service: 5, ambience: 4, value: 5, visitType: 'Coffee', likes: 14 },
  ),

  // Bloom & Blow Dry
  review(
    'bloom-blow-dry',
    'u5',
    5,
    '1 week ago',
    'Hands-down the best balayage I’ve had. They listened, the colour is exactly what I wanted and the head massage at the basin was heaven. Worth every penny.',
    { title: 'Colour wizards', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Colour & cut', likes: 22, photos: [img('hairstyle,salon', 6201)] },
  ),
  review(
    'bloom-blow-dry',
    'u3',
    5,
    '2 months ago',
    'Booked the bridal trial and they were so patient and lovely. The blow-dry bar is great for a quick pre-party glam. Will be back for the big day.',
    { food: 5, service: 5, ambience: 5, value: 4, visitType: 'Bridal', likes: 13 },
  ),

  // Sharp & Co Barbers
  review(
    'sharp-co',
    'u2',
    5,
    '3 days ago',
    'Best skin fade in Hackney and a hot-towel shave that nearly put me to sleep. Good coffee, good chat, no rushing. Found my barber for life.',
    { title: 'A cut above', food: 5, service: 5, ambience: 5, value: 5, visitType: 'Cut & shave', likes: 18 },
  ),

  // Iron Temple Gym
  review(
    'iron-temple',
    'me',
    5,
    '2 weeks ago',
    'If you actually lift, this is your place. Calibrated plates, proper platforms and coaches who know their stuff. No queues for the squat rack at 7am.',
    { title: 'A real strength gym', food: 4, service: 5, ambience: 5, value: 5, visitType: 'Membership', likes: 16 },
  ),

  // Lush Fitness Studio
  review(
    'lush-fitness',
    'u5',
    5,
    '1 week ago',
    'The candlelit reformer class is my weekly treat. Instructors actually correct your form and the studio is spotless. Smoothie afterwards is the perfect ending.',
    { title: 'Boutique done beautifully', food: 4, service: 5, ambience: 5, value: 4, visitType: 'Class', likes: 19, photos: [img('pilates,studio', 6301)] },
  ),

  // Serenity Spa
  review(
    'serenity-spa',
    'u3',
    5,
    '2 weeks ago',
    'Booked the couples massage for our anniversary and floated out. The thermal suite is gorgeous and the relaxation lounge alone is worth lingering in. Pure bliss.',
    { title: 'The city’s great exhale', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Couples treatment', likes: 25, photos: [img('spa,wellness', 6401)] },
  ),
  review(
    'serenity-spa',
    'u1',
    5,
    '2 months ago',
    'Impeccable from the moment you arrive. The facial left my skin glowing for days. Pricey, yes, but it’s a proper escape from the city.',
    { food: 4, service: 5, ambience: 5, value: 4, visitType: 'Facial', likes: 11 },
  ),

  // The Ivy House Hotel
  review(
    'ivy-house-hotel',
    'u1',
    5,
    '3 weeks ago',
    'A real gem near the British Museum. The room was beautifully done, the rooftop bar caught the evening sun and breakfast was a highlight. Staff couldn’t do enough.',
    { title: 'Charming Bloomsbury bolthole', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Weekend stay', likes: 20, photos: [img('hotel,room', 6501)] },
  ),

  // Bournemouth
  review(
    'salty-pelican',
    'u5',
    5,
    '1 week ago',
    'Sunset, a plate of fruits de mer and an Aperol on the terrace — Bournemouth honestly doesn’t get better than this. Book the front tables.',
    { title: 'Seafood with a sea breeze', food: 5, service: 4, ambience: 5, value: 4, visitType: 'Dinner', likes: 18, photos: [img('seafood,food', 6601)] },
  ),
  review(
    'boscombe-social',
    'u2',
    5,
    '2 weeks ago',
    'Proof that Boscombe has arrived. Every small plate was a winner and the natural wine list is genuinely exciting. That cheesecake though.',
    { food: 5, service: 5, ambience: 4, value: 5, visitType: 'Dinner', likes: 14 },
  ),

  // Southampton
  review(
    'dock-and-dine',
    'u3',
    5,
    '5 days ago',
    'That lobster roll lives up to the hype. Lovely spot watching the boats come in at Ocean Village — service was spot on too.',
    { title: 'Marina-side treat', food: 5, service: 5, ambience: 5, value: 4, visitType: 'Lunch', likes: 16, photos: [img('seafood,food', 6602)] },
  ),

  // West Sussex
  review(
    'cathedral-kitchen',
    'u4',
    5,
    '3 weeks ago',
    'A genuine destination restaurant for Chichester. The South Downs lamb was faultless and the cheese trolley is dangerous. Worth the drive.',
    { food: 5, service: 5, ambience: 5, value: 4, visitType: 'Celebration', likes: 21 },
  ),
  review(
    'arundel-arms',
    'u4',
    4,
    '1 month ago',
    'Everything you want from a Sussex pub — fire on, dog by the bar, proper pie. The Sunday roast books out so plan ahead.',
    { food: 4, service: 5, ambience: 5, value: 5, visitType: 'Sunday lunch', likes: 12 },
  ),
  review(
    'crawley-tandoori',
    'u6',
    5,
    '2 weeks ago',
    'Been coming for years and it never drops. Portions are huge and the lamb biryani is the best for miles.',
    { food: 5, service: 4, ambience: 4, value: 5, visitType: 'Dinner', likes: 10 },
  ),
]

export function reviewsForBusiness(businessId: string, all: Review[]): Review[] {
  return all.filter((r) => r.businessId === businessId)
}
