import type { AvailablePlaces } from "@lib/types/available";
import type { Trend } from "@lib/types/place";

/**
 * Curated trending topics replacing the source app's external Twitter
 * trends API (whose bearer token and API were not migrated).
 */

export const AVAILABLE_PLACES: AvailablePlaces = [
  {
    name: "Worldwide",
    placeType: { code: 19, name: "Supername" },
    url: "/trends",
    parentid: 0,
    country: "",
    woeid: 1,
    countryCode: null
  },
  {
    name: "United States",
    placeType: { code: 12, name: "Country" },
    url: "/trends",
    parentid: 1,
    country: "United States",
    woeid: 23424977,
    countryCode: "US"
  },
  {
    name: "United Kingdom",
    placeType: { code: 12, name: "Country" },
    url: "/trends",
    parentid: 1,
    country: "United Kingdom",
    woeid: 23424975,
    countryCode: "GB"
  },
  {
    name: "Bangladesh",
    placeType: { code: 12, name: "Country" },
    url: "/trends",
    parentid: 1,
    country: "Bangladesh",
    woeid: 23424775,
    countryCode: "BD"
  },
  {
    name: "Japan",
    placeType: { code: 12, name: "Country" },
    url: "/trends",
    parentid: 1,
    country: "Japan",
    woeid: 23424856,
    countryCode: "JP"
  },
  {
    name: "Brazil",
    placeType: { code: 12, name: "Country" },
    url: "/trends",
    parentid: 1,
    country: "Brazil",
    woeid: 23424768,
    countryCode: "BR"
  }
];

function trend(name: string, volume: number): Trend {
  return {
    name,
    url: `/search?q=${encodeURIComponent(name)}`,
    promoted_content: null,
    query: name,
    tweet_volume: volume
  };
}

export const WORLDWIDE_TRENDS: Trend[] = [
  trend("#WebDev", 128_400),
  trend("TypeScript", 96_210),
  trend("Friday Feeling", 88_930),
  trend("#OpenSource", 71_450),
  trend("React 19", 64_800),
  trend("Design Systems", 52_310),
  trend("Coffee", 48_120),
  trend("#SideProject", 39_870),
  trend("Weekend Plans", 33_260),
  trend("Standup Meetings", 27_540),
  trend("CSS", 24_980),
  trend("Dark Mode", 21_300),
  trend("Shipping Friday", 18_720),
  trend("Retro Gaming", 15_410),
  trend("Marathon Training", 12_880),
  trend("Podcasts", 10_450),
  trend("Book Recommendations", 8_930),
  trend("Home Office Setup", 7_210),
  trend("Mechanical Keyboards", 5_640),
  trend("Sunsets", 4_320)
];

export const PLACE_TRENDS: Readonly<Record<string, Trend[]>> = {
  "23424977": [
    trend("NFL Draft", 210_500),
    trend("Super Bowl", 190_300),
    trend("#WFH", 84_000),
    trend("Road Trip", 44_100),
    trend("Barbecue", 22_700)
  ],
  "23424975": [
    trend("Premier League", 175_600),
    trend("Cup Tie", 88_400),
    trend("Tea Break", 31_900),
    trend("High Street", 18_200)
  ],
  "23424775": [
    trend("Eid Mubarak", 240_100),
    trend("Cricket", 120_800),
    trend("Iftar", 74_300),
    trend("Cox's Bazar", 29_500)
  ],
  "23424856": [
    trend("桜 (Sakura)", 160_900),
    trend("Anime", 98_700),
    trend("ラーメン (Ramen)", 55_200),
    trend("Godzilla", 33_800)
  ],
  "23424768": [
    trend("Carnaval", 205_400),
    trend("Futebol", 130_600),
    trend("Churrasco", 48_900),
    trend("Praia", 26_300)
  ]
};
