export interface City {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export interface ScenicArea {
  id: string;
  name: string;
  cityId: string;
  center: [number, number];
  radius: number;
  overview: string;
  overviewSegments: Segment[];
}

export interface Attraction {
  id: string;
  name: string;
  areaId: string;
  location: [number, number]; // [lng, lat]
  radius: number;
  image: string;
  segments: Segment[];
}

export interface Segment {
  heading?: string;
  text: string;
}
