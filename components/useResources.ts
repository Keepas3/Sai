'use client';
import { useEffect, useState } from 'react';
import { client } from '@/sanity/lib/client';

export interface Resource {
  _id: string;
  title: string;
  url: string;
  description?: string;
  isPinned?: boolean;
  publishedAt: string;
}

const RESOURCES_QUERY = `*[_type == "resource"] | order(publishedAt desc) {
  _id, title, url, description, isPinned, publishedAt
}`;

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    client
      .fetch<Resource[]>(RESOURCES_QUERY)
      .then((data) => {
        if (!cancelled) setResources(data ?? []);
      })
      .catch((err) => {
        console.error('Failed to fetch resources:', err);
        if (!cancelled) setResources([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { resources, isLoading };
}
