import PocketBase from 'pocketbase';

// Use a singleton pattern to avoid multiple instances in development
const globalForPocketBase = globalThis as unknown as {
  pb: PocketBase | undefined;
};

export const pb = globalForPocketBase.pb ?? new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

if (process.env.NODE_ENV !== 'production') globalForPocketBase.pb = pb;
