import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SHOP_NAME } from '../../lib/config.js';
import { fetchStoreUnitsSoldTotal } from '../../lib/store-stats.js';
import { formatStoreSoldLabel } from '../../lib/units-sold.js';
import { useShipping } from '../../context/ShippingContext.jsx';
import { useHomeCoupons } from '../../hooks/useHomeCoupons.js';
import {
  couponTicketItem,
  couponTicketStagger,
  getStoreProfileMotionProps,
  staggerContainer,
  staggerItem,
  storeProfileAvatarPop,
  storeProfileCouponDock,
  storeProfileCover,
  storeProfileHero,
  useReducedMotion,
} from '../../lib/motion.js';
import HomeCouponTicket from './HomeCouponTicket.jsx';
import HomeCouponSheet from './HomeCouponSheet.jsx';

import verifiedBadgeUrl from '../../assets/verified-badge.png';

const PREVIEW_COUPON_LIMIT = 5;

function CouponTrack({ children, 'aria-label': ariaLabel }) {
  const trackRef = useRef(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  const updateFades = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setFadeLeft(el.scrollLeft > 2);
    setFadeRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateFades();
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    el.addEventListener('scroll', updateFades, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateFades);
    };
  }, [updateFades, children]);

  return (
    <div
      className={[
        'home-store-profile__coupon-track-wrap',
        fadeLeft ? 'home-store-profile__coupon-track-wrap--fade-left' : '',
        fadeRight ? 'home-store-profile__coupon-track-wrap--fade-right' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        ref={trackRef}
        className="home-store-profile__coupon-track"
        aria-label={ariaLabel}
        onScroll={updateFades}
      >
        {children}
      </div>
      <div className="home-store-profile__coupon-fade home-store-profile__coupon-fade--left" aria-hidden />
      <div className="home-store-profile__coupon-fade home-store-profile__coupon-fade--right" aria-hidden />
    </div>
  );
}

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

function StoreAvatar({ url, name, onDark = false, animate = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = url && !failed;
  const className = `home-store-profile__avatar${onDark ? ' home-store-profile__avatar--on-cover' : ''}`;

  const avatar = showImage ? (
    <img
      className={className}
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`${className} home-store-profile__avatar--fallback${onDark ? ' home-store-profile__avatar--on-cover' : ''}`}
      aria-hidden
    >
      {(name || SHOP_NAME).charAt(0).toUpperCase()}
    </div>
  );

  if (!animate) return avatar;

  return (
    <motion.span
      className="home-store-profile__avatar-wrap"
      variants={storeProfileAvatarPop}
      initial="initial"
      animate="animate"
    >
      {avatar}
    </motion.span>
  );
}

function StoreProfileCover({ coverImageUrl, onError, animate = true }) {
  return (
    <div className="home-store-profile__media" aria-hidden>
      <motion.img
        className="home-store-profile__cover"
        src={coverImageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={onError}
        variants={storeProfileCover}
        initial={animate ? 'initial' : false}
        animate="animate"
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
  );
}

export default function HomeStoreProfile({
  profileImageUrl: profileImageUrlOverride,
  coverImageUrl: coverImageUrlOverride,
  unitsSold: unitsSoldOverride,
  hideCompactCoupons = false,
  preview = false,
}) {
  const reduced = useReducedMotion();
  const motionProps = getStoreProfileMotionProps({ preview, reduced });
  const { profileImageUrl: contextProfileUrl, coverImageUrl: contextCoverUrl, unitsSoldDisplay } = useShipping();
  const profileImageUrl =
    profileImageUrlOverride !== undefined ? profileImageUrlOverride : contextProfileUrl;
  const coverImageUrl = coverImageUrlOverride !== undefined ? coverImageUrlOverride : contextCoverUrl;
  const [coverFailed, setCoverFailed] = useState(false);
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
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
  const previewPromos = visiblePromos.slice(0, PREVIEW_COUPON_LIMIT);
  const hasMoreCoupons = visiblePromos.length > PREVIEW_COUPON_LIMIT;
  const remainingCouponCount = visiblePromos.length - PREVIEW_COUPON_LIMIT;
  const hasCover = Boolean(coverImageUrl) && !coverFailed;
  const animate = !preview && !reduced;

  return (
    <motion.section
      className={[
        'home-store-profile card-canvas home-store-profile--hero',
        hasCover ? 'home-store-profile--cover' : '',
        preview ? 'home-store-profile--preview' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="โปรไฟล์ร้าน"
      variants={storeProfileHero}
      {...motionProps}
    >
      {hasCover ? (
        <StoreProfileCover
          coverImageUrl={coverImageUrl}
          onError={() => setCoverFailed(true)}
          animate={animate}
        />
      ) : (
        <div className="home-store-profile__hero-fallback" aria-hidden />
      )}

      <div className="home-store-profile__body">
        <div className="home-store-profile__spacer" aria-hidden />

        <motion.div
          className="home-store-profile__identity-band"
          variants={animate ? staggerContainer : undefined}
          initial={animate ? 'initial' : false}
          animate="animate"
        >
          <div className="home-store-profile__header">
            <Link to="/catalog" className="home-store-profile__identity">
              <StoreAvatar url={profileImageUrl} name={SHOP_NAME} onDark={hasCover} animate={animate} />
              <div className="home-store-profile__identity-text">
                <motion.span className="home-store-profile__name" variants={animate ? staggerItem : undefined}>
                  {SHOP_NAME}
                </motion.span>
                {!statsLoading && soldLabel ? (
                  <motion.span className="home-store-profile__sold" variants={animate ? staggerItem : undefined}>
                    {soldLabel}
                  </motion.span>
                ) : null}
              </div>
            </Link>
          </div>

          <motion.div className="home-store-profile__badges" variants={animate ? staggerItem : undefined}>
            <span className="home-store-profile__badge home-store-profile__badge--casio">
              <VerifiedBadgeIcon />
              ผู้จัดจำหน่ายอย่างเป็นทางการ
            </span>
          </motion.div>
        </motion.div>

        <div className="home-store-profile__coupon-dock">
          {couponsLoading ? (
            <p className="home-store-profile__coupon-loading text-sm text-muted">กำลังโหลดคูปอง...</p>
          ) : showCoupons ? (
            <motion.div
              variants={animate ? storeProfileCouponDock : undefined}
              initial={animate ? 'initial' : false}
              animate="animate"
            >
              <CouponTrack aria-label="คูปองส่วนลด">
                <motion.div
                  className="home-store-profile__coupon-stagger"
                  variants={animate ? couponTicketStagger : undefined}
                  initial={animate ? 'initial' : false}
                  animate="animate"
                  style={{ display: 'contents' }}
                >
                  {previewPromos.map((promo) => (
                    <motion.div
                      key={promo.id}
                      variants={animate ? couponTicketItem : undefined}
                      style={{ display: 'contents' }}
                    >
                      <HomeCouponTicket
                        promo={promo}
                        compact
                        collecting={collectingId === promo.id}
                        collected={isCollected(promo)}
                        onCollect={handleCollect}
                      />
                    </motion.div>
                  ))}
                  {hasMoreCoupons ? (
                    <motion.div variants={animate ? couponTicketItem : undefined} style={{ display: 'contents' }}>
                      <button
                        type="button"
                        className="home-coupon-ticket home-coupon-ticket--compact home-coupon-ticket--view-all"
                        onClick={() => setCouponSheetOpen(true)}
                        aria-label={`ดูคูปองทั้งหมด ${visiblePromos.length} ใบ`}
                      >
                        <div className="home-coupon-ticket__body glass-surface-sm">
                          <span className="home-coupon-ticket__view-all-label">ดูทั้งหมด</span>
                          <span className="home-coupon-ticket__view-all-count">+{remainingCouponCount}</span>
                        </div>
                      </button>
                    </motion.div>
                  ) : null}
                </motion.div>
              </CouponTrack>
            </motion.div>
          ) : showCouponLink ? (
            <Link to="/account/promos" className="home-store-profile__coupon-link text-sm text-primary">
              ดูคูปองส่วนลด →
            </Link>
          ) : null}
        </div>
      </div>

      <HomeCouponSheet
        open={couponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        promos={visiblePromos}
        collectingId={collectingId}
        handleCollect={handleCollect}
        isCollected={isCollected}
      />
    </motion.section>
  );
}
