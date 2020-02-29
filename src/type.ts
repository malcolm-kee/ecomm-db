import { Sharp } from 'sharp';

export interface ImageData {
  sharp: Sharp;
  width: number;
  height: number;
  format: string;
  blur: boolean;
  buffer: Buffer | null;
}

export interface Product {
  id: number;
  name: string;
  descriptions: string[];
  image: string;
  department: string;
  price: string;
}

export interface ProcessedProduct extends Product {
  related: number[];
  imgs: {
    size: string;
    img: ImageData;
  }[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  joinedDate: number;
  avatar: string;
}

export interface Comment {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  content: string;
  createdOn: number;
}

export interface GenerateImageOption {
  width: number;
  height: number;
  format: 'jpg' | 'webp';
  blur?: boolean;
  fit?: 'contain' | 'cover';
  position?: 'top' | 'center';
}

export interface ImageInfo {
  images: ImageData[];
}

export interface BannerInfo {
  [key: string]: string;
}

export interface ProductImageInfo {
  [imageType: string]: string;
}

export interface JobPosting {
  id: number;
  title: string;
  department: string;
  level: 'internship' | 'entry' | 'experienced' | 'manager';
  summary: string;
  descriptions: string[];
  requirements: string[];
}

export interface DbProduct extends Product {
  related: number[];
  images: ProductImageInfo | null;
}
export type DbBanner = BannerInfo;
export type DbUser = User;
export type DbComment = Comment;
