import { motion } from 'framer-motion';
import { Link2, Upload } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';

export type MediaKind = 'image' | 'video' | 'embed';
export type PlatformName = 'גלריה' | 'טיקטוק' | 'אינסטגרם' | 'פייסבוק' | 'X' | 'קישור';

export type UploadDraft = {
  title: string;
  creator: string;
  summary: string;
  openingPrice: number;
  mediaKind: MediaKind;
  mediaUrl: string;
  sourceLink?: string;
  platform: PlatformName;
};

type UploadPanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: UploadDraft) => void;
  onCreateObjectUrl: (file: File) => string;
};

const imageExt = /\.(jpg|jpeg|png|webp|gif)$/i;
const videoExt = /\.(mp4|webm|mov|m4v)$/i;

const parseLink = (rawUrl: string, preferredKind: 'image' | 'video'): Omit<UploadDraft, 'title' | 'creator' | 'summary' | 'openingPrice'> => {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (imageExt.test(lower)) {
    return { mediaKind: 'image', mediaUrl: url, platform: 'קישור', sourceLink: url };
  }
  if (videoExt.test(lower)) {
    return { mediaKind: 'video', mediaUrl: url, platform: 'קישור', sourceLink: url };
  }

  const tiktokMatch = /tiktok\.com\/.+\/video\/(\d+)/i.exec(url);
  if (tiktokMatch) {
    return {
      mediaKind: 'embed',
      mediaUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`,
      platform: 'טיקטוק',
      sourceLink: url,
    };
  }

  const instaMatch = /instagram\.com\/(reel|p)\/([^/?#]+)/i.exec(url);
  if (instaMatch) {
    return {
      mediaKind: 'embed',
      mediaUrl: `https://www.instagram.com/${instaMatch[1]}/${instaMatch[2]}/embed`,
      platform: 'אינסטגרם',
      sourceLink: url,
    };
  }

  if (/facebook\.com|fb\.watch/i.test(url)) {
    return {
      mediaKind: 'embed',
      mediaUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`,
      platform: 'פייסבוק',
      sourceLink: url,
    };
  }

  if (/x\.com|twitter\.com/i.test(url)) {
    return {
      mediaKind: 'embed',
      mediaUrl: `https://twitframe.com/show?url=${encodeURIComponent(url)}`,
      platform: 'X',
      sourceLink: url,
    };
  }

  return {
    mediaKind: preferredKind,
    mediaUrl: url,
    platform: 'קישור',
    sourceLink: url,
  };
};

export default function UploadPanel({ open, onClose, onSubmit, onCreateObjectUrl }: UploadPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [summary, setSummary] = useState('');
  const [openingPrice, setOpeningPrice] = useState('500');
  const [preferredKind, setPreferredKind] = useState<'image' | 'video'>('video');
  const [linkInput, setLinkInput] = useState('');
  const [mediaKind, setMediaKind] = useState<MediaKind>('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [platform, setPlatform] = useState<PlatformName>('גלריה');
  const [sourceLink, setSourceLink] = useState('');
  const [statusLine, setStatusLine] = useState('בחרו קובץ או הדביקו קישור');

  if (!open) return null;

  const applyLink = () => {
    if (!linkInput.trim()) return;
    const parsed = parseLink(linkInput, preferredKind);
    setMediaKind(parsed.mediaKind);
    setMediaUrl(parsed.mediaUrl);
    setSourceLink(parsed.sourceLink ?? '');
    setPlatform(parsed.platform);
    setStatusLine(`נטען מקור ${parsed.platform}`);
  };

  const onFilePick = (file: File | undefined) => {
    if (!file) return;
    const url = onCreateObjectUrl(file);
    const isVideo = file.type.startsWith('video/');
    setMediaKind(isVideo ? 'video' : 'image');
    setMediaUrl(url);
    setSourceLink('');
    setPlatform('גלריה');
    setStatusLine(`נטען ${isVideo ? 'וידאו' : 'תמונה'} מהגלריה`);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericPrice = Math.round(Number(openingPrice));
    if (!title.trim() || !creator.trim() || !summary.trim() || !mediaUrl.trim()) return;
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;

    onSubmit({
      title: title.trim(),
      creator: creator.trim(),
      summary: summary.trim(),
      openingPrice: numericPrice,
      mediaKind,
      mediaUrl,
      sourceLink: sourceLink || undefined,
      platform,
    });

    setTitle('');
    setCreator('');
    setSummary('');
    setOpeningPrice('500');
    setMediaKind('video');
    setMediaUrl('');
    setSourceLink('');
    setPlatform('גלריה');
    setLinkInput('');
    setStatusLine('בחרו קובץ או הדביקו קישור');
  };

  return (
    <motion.aside
      className="holo-panel pointer-events-auto absolute inset-x-3 top-20 z-40 mx-auto w-auto max-w-lg rounded-3xl p-3 md:inset-x-auto md:right-6 md:top-24 md:w-[420px]"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 20 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">העלאה</p>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/80">
          סגור
        </button>
      </div>

      <form onSubmit={submit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
            placeholder="שם נכס"
          />
          <input
            value={creator}
            onChange={(event) => setCreator(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
            placeholder="שם יוצר"
          />
        </div>

        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
          placeholder="תיאור קצר"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPreferredKind('video')}
            className={`rounded-xl border px-3 py-2 text-xs ${preferredKind === 'video' ? 'border-[#CCFF00]/40 bg-[#CCFF00]/15 text-[#E8FF9A]' : 'border-white/15 bg-black/20 text-white/75'}`}
          >
            וידאו
          </button>
          <button
            type="button"
            onClick={() => setPreferredKind('image')}
            className={`rounded-xl border px-3 py-2 text-xs ${preferredKind === 'image' ? 'border-[#CCFF00]/40 bg-[#CCFF00]/15 text-[#E8FF9A]' : 'border-white/15 bg-black/20 text-white/75'}`}
          >
            תמונה
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={linkInput}
            onChange={(event) => setLinkInput(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
            placeholder="קישור טיקטוק אינסטגרם פייסבוק X או קישור ישיר"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/85"
          >
            <Link2 size={14} />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => onFilePick(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-[#FF007F]/35 bg-[#FF007F]/15 px-3 py-2 text-xs font-semibold text-[#FFD7EC]"
        >
          <Upload size={14} />
          בחירה מהגלריה
        </button>

        <div className="grid grid-cols-2 gap-2">
          <input
            value={openingPrice}
            onChange={(event) => setOpeningPrice(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
            inputMode="numeric"
            placeholder="מחיר פתיחה"
          />
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
            {statusLine}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/18 px-4 py-2 text-sm font-semibold text-[#E8FF9A]"
        >
          העלאה לפיד
        </button>
      </form>
    </motion.aside>
  );
}
