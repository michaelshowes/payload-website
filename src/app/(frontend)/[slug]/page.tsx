import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { cache } from 'react';

import configPromise from '@payload-config';
import { getPayloadHMR } from '@payloadcms/next/utilities';

import type { Page as PageType } from '@/payload-types';
import { RenderBlocks } from '@/payload/blocks/RenderBlocks';
import { PayloadRedirects } from '@/payload/components/PayloadRedirects';
import { RenderHero } from '@/payload/components/heros/RenderHero';
import { generateMeta } from '@/payload/utilities/generateMeta';

import PageClient from './page.client';

export async function generateStaticParams() {
  const payload = await getPayloadHMR({ config: configPromise });
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false
  });

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home';
    })
    .map(({ slug }) => {
      return { slug };
    });

  return params;
}

type Args = {
  params: Promise<{
    slug?: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = 'home' } = await paramsPromise;
  const url = '/' + slug;

  let page: PageType | null;

  page = await queryPageBySlug({ slug });

  if (!page) {
    return <PayloadRedirects url={url} />;
  }

  const { hero, layout } = page;

  return (
    <article className='pt-16 pb-24'>
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects
        disableNotFound
        url={url}
      />

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  );
}

export async function generateMetadata({
  params: paramsPromise
}): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise;
  const page = await queryPageBySlug({
    slug
  });

  return generateMeta({ doc: page });
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode();

  const payload = await getPayloadHMR({ config: configPromise });

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug
      }
    }
  });

  return result.docs?.[0] || null;
});
