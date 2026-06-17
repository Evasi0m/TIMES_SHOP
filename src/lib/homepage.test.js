import { describe, expect, it } from 'vitest';
import {
  normalizeBannerImage,
  resolveBannerLink,
  validateBannerImageForSave,
} from './homepage.js';

describe('banner link helpers', () => {
  it('normalizeBannerImage infers url type from legacy link_url', () => {
    const img = normalizeBannerImage({
      image_url: 'https://example.com/b.jpg',
      link_url: '/catalog',
    });
    expect(img.link_type).toBe('url');
    expect(img.link_url).toBe('/catalog');
  });

  it('resolveBannerLink builds product PDP path', () => {
    const link = resolveBannerLink({
      image_url: 'https://example.com/b.jpg',
      link_type: 'product',
      tiktok_product_id: '1734098765432109801',
      tiktok_sku_id: '1734123456789012301',
    });
    expect(link).toEqual({
      kind: 'internal',
      to: '/product/p/1734098765432109801?sku=1734123456789012301',
    });
  });

  it('resolveBannerLink handles external url', () => {
    const link = resolveBannerLink({
      image_url: 'https://example.com/b.jpg',
      link_type: 'url',
      link_url: 'https://example.com/promo',
    });
    expect(link).toEqual({ kind: 'external', href: 'https://example.com/promo' });
  });

  it('resolveBannerLink strips router basename from internal path', () => {
    const link = resolveBannerLink({
      image_url: 'https://example.com/b.jpg',
      link_type: 'url',
      link_url: '/TIMES_SHOP/catalog',
    });
    expect(link).toEqual({ kind: 'internal', to: '/catalog' });
  });

  it('validateBannerImageForSave requires product id for product links', () => {
    expect(() =>
      validateBannerImageForSave(
        { image_url: 'https://example.com/b.jpg', link_type: 'product' },
        'รูปที่ 1',
      ),
    ).toThrow(/Product ID/);
  });
});
