import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SHOP_NAME } from '../../lib/config.js';
import { fetchStoreUnitsSoldTotal } from '../../lib/store-stats.js';
import { formatStoreSoldLabel } from '../../lib/units-sold.js';
import { useShipping } from '../../context/ShippingContext.jsx';
import { useHomeCoupons } from '../../hooks/useHomeCoupons.js';
import HomeCouponTicket from './HomeCouponTicket.jsx';

import verifiedBadgeUrl from '../../assets/verified-badge.png';

function VerifiedBadgeIcon() {
  return (
    <img
      className="home-store-profile__verified-badge"
      src={verifiedBadgeUrl}
      alt=""
      width={19}
      height={19}
      decoding="async"
      aria-hidden
    />
  );
}

function ChevronIcon() {
  return (
    <svg className="home-store-profile__chevron" viewBox="0 0 20 20" aria-hidden>
      <path
        d="M7.5 5 12.5 10 7.5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function StoreAvatar({ url, name, onDark = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = url && !failed;

  if (showImage) {
    return (
      <img
        className={`home-store-profile__avatar${onDark ? ' home-store-profile__avatar--on-cover' : ''}`}
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`home-store-profile__avatar home-store-profile__avatar--fallback${onDark ? ' home-store-profile__avatar--on-cover' : ''}`}
      aria-hidden
    >
      {(name || SHOP_NAME).charAt(0).toUpperCase()}
    </div>
  );
}

export default function HomeStoreProfile({
  profileImageUrl: profileImageUrlOverride,
  coverImageUrl: coverImageUrlOverride,
  unitsSold: unitsSoldOverride,
  hideCompactCoupons = false,
  preview = false,
}) {
  const { profileImageUrl: contextProfileUrl, coverImageUrl: contextCoverUrl, unitsSoldDisplay } = useShipping();
  const profileImageUrl =
    profileImageUrlOverride !== undefined ? profileImageUrlOverride : contextProfileUrl;
  const coverImageUrl = coverImageUrlOverride !== undefined ? coverImageUrlOverride : contextCoverUrl;
  const [coverFailed, setCoverFailed] = useState(false);
  const { visiblePromos, loading: couponsLoading, collectingId, handleCollect, isCollected } =
    useHomeCoupons();
  const [unitsSold, setUnitsSold] = useState(
    unitsSoldOverride ?? (unitsSoldDisplay != null ? unitsSoldDisplay : null)
  );
  const [statsLoading, setStatsLoading] = useState(
    unitsSoldOverride == null && unitsSoldDisplay == null
  );

  useEffect(() => {
    setCoverFailed(false);
  }, [coverImageUrl]);

  useEffect(() => {
    if (unitsSoldOverride != null) {
      setUnitsSold(unitsSoldOverride);
      setStatsLoading(false);
      return;
    }
    if (unitsSoldDisplay != null) {
      setUnitsSold(unitsSoldDisplay);
      setStatsLoading(false);
      return;
    }
    let active = true;
    fetchStoreUnitsSoldTotal()
      .then((total) => {
        if (!active) return;
        setUnitsSold(total);
        setStatsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setStatsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [unitsSoldOverride, unitsSoldDisplay]);

  const soldLabel = formatStoreSoldLabel(unitsSold);
  const showCoupons = !hideCompactCoupons && !couponsLoading && visiblePromos.length > 0;
  const showCouponLink = hideCompactCoupons && !couponsLoading && visiblePromos.length > 0;
  const hasCover = Boolean(coverImageUrl) && !coverFailed;

  return (
    <section
      className={[
        'home-store-profile card-canvas',
        hasCover ? 'home-store-profile--cover' : '',
        preview ? 'home-store-profile--preview' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="โปรไฟล์ร้าน"
    >
      {hasCover ? (
        <div className="home-store-profile__media" aria-hidden>
          <img
            className="home-store-profile__cover"
            src={coverImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setCoverFailed(true)}
          />
          <img
            className="home-store-profile__cover-blur"
            src={coverImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden
          />
          <div className="home-store-profile__fade" />
        </div>
      ) : null}

      <div className="home-store-profile__body">
        <div className="home-store-profile__header">
          <Link to="/catalog" className="home-store-profile__identity">
            <StoreAvatar url={profileImageUrl} name={SHOP_NAME} />
            <span className="home-store-profile__name">{SHOP_NAME}</span>
            <ChevronIcon />
          </Link>
          {!statsLoading && soldLabel ? (
            <span className="home-store-profile__sold">{soldLabel}</span>
          ) : null}
        </div>

        <div className="home-store-profile__badges">
          <span className="home-store-profile__badge home-store-profile__badge--casio">
            <VerifiedBadgeIcon />
            ผู้จัดจำหน่ายอย่างเป็นทางการ
          </span>
        </div>

        {couponsLoading ? (
          <p className="home-store-profile__coupon-loading text-sm text-muted">กำลังโหลดคูปอง...</p>
        ) : showCoupons ? (
          <div className="home-store-profile__coupon-track" aria-label="คูปองส่วนลด">
            {visiblePromos.map((promo) => (
              <HomeCouponTicket
                key={promo.id}
                promo={promo}
                compact
                collecting={collectingId === promo.id}
                collected={isCollected(promo)}
                onCollect={handleCollect}
              />
            ))}
          </div>
        ) : showCouponLink ? (
          <Link to="/account/promos" className="home-store-profile__coupon-link text-sm text-primary">
            ดูคูปองส่วนลด →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
