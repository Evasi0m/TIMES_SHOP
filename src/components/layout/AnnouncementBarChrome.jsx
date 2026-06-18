import { AnnouncementVisualizerIcon, MegaphoneIcon } from '../icons.jsx';

export default function AnnouncementBarChrome({ children, className = '', ...props }) {
  return (
    <div className={['announcement-bar', 'group', className].filter(Boolean).join(' ')} {...props}>
      <span className="announcement-bar__icon announcement-bar__icon--left" aria-hidden="true">
        <MegaphoneIcon size={18} />
      </span>

      <div className="announcement-bar__viewport">
        <div className="announcement-bar__fade announcement-bar__fade--left" aria-hidden="true" />
        <div className="announcement-bar__fade announcement-bar__fade--right" aria-hidden="true" />
        {children}
      </div>

      <span className="announcement-bar__icon announcement-bar__icon--right" aria-hidden="true">
        <AnnouncementVisualizerIcon size={20} />
      </span>
    </div>
  );
}
