export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-seasonal-tastes-better',
    title: 'Why seasonal produce actually tastes better',
    date: 'March 12, 2026',
    readTime: '5 min read',
    excerpt:
      'Tomatoes in January and peak-summer berries are not the same thing. Here is how shorter supply chains and harvest timing change what lands in your Eato box.',
    tags: ['Seasonal', 'Produce', 'Quality'],
    body: [
      'When fruit and vegetables are picked closer to ripeness—and travel fewer miles—sugars and aromatics develop the way nature intended. That is the difference between “looks fine” and “tastes like something you remember from childhood.”',
      'At Eato we lean on growers and kitchens that plan around the calendar, not the other way around. That means your box shifts week to week, which is a feature: you eat what is thriving right now, not what was engineered to sit on a shelf for a month.',
      'If you are new to seasonal eating, start with one category you care about most—berries, greens, or citrus—and notice how color, scent, and texture change across the year. Small observations add up to better meals with less effort.',
    ],
  },
  {
    slug: 'meal-prep-with-local-produce',
    title: 'Meal prep that does not feel like a second job',
    date: 'March 2, 2026',
    readTime: '6 min read',
    excerpt:
      'Batch cooking is easier when your ingredients already taste great. Simple templates for bowls, wraps, and one-pan dinners using pantry staples from the shop.',
    tags: ['Meal prep', 'Recipes', 'Pantry'],
    body: [
      'The goal of meal prep is not Instagram grids; it is having “good enough” food ready when you are tired. We like the 2+2+1 rule: two cooked bases (grains or legumes), two prepped vegetables, and one sauce or dressing that ties everything together.',
      'Roast a tray of seasonal vegetables on Sunday, cook a pot of quinoa or rice, and keep a jar of lemon–herb yogurt or tahini dressing in the fridge. For three days you can assemble different bowls without repeating the same plate.',
      'Eato’s shop categories—nuts, oils, dairy, bakery—are meant to stack with restaurant favorites so you are never one random ingredient away from dinner.',
    ],
  },
  {
    slug: 'restaurants-go-greener',
    title: 'How partner restaurants are cutting kitchen waste',
    date: 'February 18, 2026',
    readTime: '7 min read',
    excerpt:
      'Smaller menus, smarter ordering, and honest portions: three patterns we see from Eato restaurant partners who want sustainability without sacrificing flavor.',
    tags: ['Restaurants', 'Sustainability'],
    body: [
      'Waste often starts at ordering, not at the pass. Restaurants that sync weekly specials with what growers have in abundance throw out less and can price specials fairly.',
      'Cross-utilizing one ingredient in two dishes—think roasted carrots as a side and as a puree for a sauce—reduces trim and speeds up service during rush hours.',
      'If you run a kitchen and want to join the network, Eato is built for clear menus, transparent status, and customers who already care where food comes from.',
    ],
  },
  {
    slug: 'reading-organic-labels',
    title: 'Organic labels: what matters for your weekly shop',
    date: 'February 4, 2026',
    readTime: '4 min read',
    excerpt:
      'A calm guide to what “organic” usually promises, where it helps most, and how to build a cart you feel good about without overthinking every item.',
    tags: ['Organic', 'Shopping', 'Education'],
    body: [
      'Certified organic production limits certain pesticides and emphasizes soil health. For some foods—leafy greens, berries, grains—that choice can meaningfully reduce residues you eat often.',
      'Prioritize organic for foods you consume daily or in large volume, and use trusted local sources when certification is not available but practices are transparent.',
      'Eato combines curated grocery picks with restaurant meals so you can apply the same standards whether you are cooking at home or ordering in.',
    ],
  },
  {
    slug: 'behind-eato-box',
    title: 'Inside an Eato weekly box: how picks come together',
    date: 'January 22, 2026',
    readTime: '5 min read',
    excerpt:
      'From grower updates to kitchen specials, here is a simplified look at how we shortlist items for the storefront and keep variety high without chaos.',
    tags: ['Behind the scenes', 'Eato'],
    body: [
      'Each week we balance staples you rely on with a few “discovery” items—something new to try in a salad, smoothie, or side dish.',
      'Weather and logistics happen; when a crop runs short, we substitute thoughtfully and communicate through the storefront so you are not surprised at checkout.',
      'Feedback from customers and restaurants flows back into what we stock next, which keeps the catalog grounded in real meals, not trends that fade in a week.',
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
