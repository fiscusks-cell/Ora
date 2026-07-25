const UNSPLASH_CLIENT_ID = process.env.NEXT_PUBLIC_UNSPLASH_CLIENT_ID ?? '';

export interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
  alt_description: string | null;
}

export async function fetchRandomPhotos(query = 'minimal workspace', count = 5): Promise<UnsplashPhoto[]> {
  if (!UNSPLASH_CLIENT_ID) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&count=${count}&orientation=landscape&client_id=${UNSPLASH_CLIENT_ID}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
