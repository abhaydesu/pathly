export type LinkData = {
  _id: string; // MongoDB adds an _id
  originalUrl: string;
  shortId: string;
  clicks: number;
  createdAt: string;
};