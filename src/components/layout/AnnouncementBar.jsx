import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useShipping } from '../../context/ShippingContext.jsx';
import AnnouncementBarChrome from './AnnouncementBarChrome.jsx';

function MarqueeSegment({ items }) {
  return items.map((item, index) => (
    <span key={item.id} className="announcement-bar__segment">
      {index > 0 && <span className="announcement-bar__sep"> / </span>}
      {item.link_url ? (
        <a
          href={item.link_url}
          className="announcement-bar__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.text}
        </a>
      ) : (
        item.text
      )}
    </span>
  ));
}

export default function AnnouncementBar() {
  const { pathname } = useLocation();
  const { announcementEnabled, announcementItems, loading } = useShipping();
  const contentRef = useRef(null);
  const [duration, setDuration] = useState(30);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const updateDuration = () => {
      const width = node.offsetWidth;
      const speed = 60;
      setDuration(Math.max(15, width / speed));
    };

    updateDuration();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateDuration) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [announcementItems]);

  if (pathname.startsWith('/admin')) return null;
  if (loading || !announcementEnabled || !announcementItems.length) return null;

  const staticTrack = reducedMotion;

  return (
    <AnnouncementBarChrome
      role="marquee"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={`announcement-bar__track${staticTrack ? ' announcement-bar__track--static' : ''}`}
        style={{
          '--marquee-duration': `${duration}s`,
          animationPlayState: paused || staticTrack ? 'paused' : 'running',
        }}
      >
        <span className="announcement-bar__content" ref={contentRef}>
          <MarqueeSegment items={announcementItems} />
        </span>
        {!staticTrack && (
          <span className="announcement-bar__content" aria-hidden="true">
            <MarqueeSegment items={announcementItems} />
          </span>
        )}
      </div>
    </AnnouncementBarChrome>
  );
}
