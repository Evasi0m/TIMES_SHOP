import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizeBannerImage, resolveBannerLink } from '../../lib/homepage.js';

function BannerImage({ image, aspectClass }) {
  const normalized = normalizeBannerImage(image);
  const link = resolveBannerLink(normalized);
  const content = (
    <img src={normalized.image_url} alt="" className={`home-banner__img ${aspectClass}`} loading="lazy" />
  );

  if (!link) return content;

  if (link.kind === 'external') {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="home-banner__link"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={link.to} className="home-banner__link">
      {content}
    </Link>
  );
}

function SlideBanner({ images, aspectClass }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="home-banner home-banner--slide">
      <div className="home-banner__slide-viewport">
        <div className="home-banner__slide-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((image, i) => (
            <div key={`${image.image_url}-${i}`} className="home-banner__slide-item">
              <BannerImage image={image} aspectClass={aspectClass} />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="home-banner__nav home-banner__nav--prev hidden lg:flex"
            aria-label="ก่อนหน้า"
            onClick={() => setIndex((prev) => (prev - 1 + images.length) % images.length)}
          >
            ‹
          </button>
          <button
            type="button"
            className="home-banner__nav home-banner__nav--next hidden lg:flex"
            aria-label="ถัดไป"
            onClick={() => setIndex((prev) => (prev + 1) % images.length)}
          >
            ›
          </button>
          <div className="home-banner__dots">
            {images.map((image, i) => (
              <button
                key={`dot-${image.image_url}-${i}`}
                type="button"
                className={`home-banner__dot ${i === index ? 'home-banner__dot--active' : ''}`.trim()}
                aria-label={`สไลด์ ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomeBanner({ block }) {
  const config = block?.config ?? {};
  const layout = config.layout || 'single';
  const aspect = layout === 'row' ? '1:1' : config.aspect || '16:9';
  const images = useMemo(
    () =>
      (Array.isArray(config.images) ? config.images : [])
        .map(normalizeBannerImage)
        .filter((img) => img.image_url),
    [config.images],
  );

  if (!images.length) return null;

  const aspectClass = aspect === '1:1' ? 'home-banner__img--square' : 'home-banner__img--wide';

  if (layout === 'slide') {
    return (
      <section className="home-section">
        {block.title && <h2 className="home-section__title">{block.title}</h2>}
        <SlideBanner images={images} aspectClass={aspectClass} />
      </section>
    );
  }

  if (layout === 'row') {
    return (
      <section className="home-section">
        {block.title && <h2 className="home-section__title">{block.title}</h2>}
        <div className="home-banner home-banner--row">
          {images.map((image, i) => (
            <div key={`${image.image_url}-${i}`} className="home-banner__row-item">
              <BannerImage image={image} aspectClass="home-banner__img--square" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (layout === 'bento') {
    return (
      <section className="home-section">
        {block.title && <h2 className="home-section__title">{block.title}</h2>}
        <div className="home-banner home-banner--bento">
          {images.map((image, i) => (
            <div
              key={`${image.image_url}-${i}`}
              className={`home-banner__bento-item ${i === 0 ? 'home-banner__bento-item--hero' : ''}`.trim()}
            >
              <BannerImage image={image} aspectClass={aspectClass} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="home-section">
      {block.title && <h2 className="home-section__title">{block.title}</h2>}
      <div className="home-banner home-banner--single">
        <BannerImage image={images[0]} aspectClass={aspectClass} />
      </div>
    </section>
  );
}
