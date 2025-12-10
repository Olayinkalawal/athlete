import { 
  LayoutGrid, 
  Bot, 
  TrendingUp,
  Settings 
} from "lucide-react";

// Sport-specific icons from react-icons (Font Awesome)
import { 
  FaFutbol,      // Soccer ball
  FaBasketball,  // Basketball
  FaUserNinja,   // Martial arts (Boxing/MMA)
  FaFire,        // MMA intensity
  FaBolt,        // Taekwondo kicks
  FaFootball     // American football
} from "react-icons/fa6";

export const NAVIGATION_ITEMS = [
  { icon: LayoutGrid, label: "Overview", href: "/", active: false },
  { icon: TrendingUp, label: "Progress", href: "/progress", active: false },
  { icon: Bot, label: "AI Coach", href: "/ai-coach", badge: "Beta", active: false },
  { icon: Settings, label: "Settings", href: "/settings", active: false },
];

export const DISCIPLINES = [
  {
    id: 1,
    slug: "football",
    name: "Football",
    description: "Ball control, passing & shooting",
    icon: "Activity",
    colorClass: "text-white",
    bgClass: "bg-white",
    count: "12.5k",
    drills: [] // Drills from database only
  },
  {
    id: 2,
    slug: "basketball",
    name: "Basketball",
    description: "Shooting mechanics & vertical jump",
    icon: "CircleDot",
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    count: "8.3k",
    drills: [] // Drills from database only
  },
  {
    id: 3,
    slug: "boxing",
    name: "Boxing",
    description: "Footwork, jabs & defense",
    icon: "Swords",
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
    count: "6.7k",
    drills: [] // Drills from database only
  },
  {
    id: 4,
    slug: "mma",
    name: "MMA",
    description: "Grappling & striking mix",
    icon: "Flame",
    colorClass: "text-yellow-500",
    bgClass: "bg-yellow-500/10",
    count: "5.2k",
    drills: [] // Drills from database only
  },
  {
    id: 5,
    slug: "taekwondo",
    name: "Taekwondo",
    description: "Flexibility & high kicks",
    icon: "Footprints",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    count: "4.1k",
    drills: [] // Drills from database only
  },
  {
    id: 6,
    slug: "american-football",
    name: "American Football",
    description: "Routes & strength",
    icon: "Shield",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
    count: "7.8k",
    hiddenOnMobile: true,
    drills: [] // Drills from database only
  },
];

export const USER_PROFILE = {
  name: "Alex Morgan",
  plan: "Pro Plan",
  avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2574&auto=format&fit=crop"
};

// DRILLS array removed - all drills now come from database
// Only custom AI-generated drills are shown
export const DRILLS: any[] = [];

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface SessionItem {
  id: string;
  label: string;
  checked: boolean;
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        role: 'bot',
        text: "I've analyzed your last set. Your non-dominant foot accuracy is at 65%. Let's prioritize Wall Passes today.",
        timestamp: 'Today 2:30 PM'
    },
    {
        id: '2',
        role: 'user',
        text: "Sounds good. Add them to my queue?",
        timestamp: 'Today 2:31 PM'
    },
    {
        id: '3',
        role: 'bot',
        text: "Done. I also increased the intensity slightly.",
        timestamp: 'Today 2:31 PM'
    }
];

export const SESSION_ITEMS: SessionItem[] = [
    { id: '1', label: "Warm-up: Light Jogging", checked: true },
    { id: '2', label: "Cone Dribbling", checked: true },
    { id: '3', label: "Wall Pass (Left Foot)", checked: false },
    { id: '4', label: "Penalty Shots", checked: false }
];
