import { motion } from 'framer-motion';
import { Link2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

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
  file?: File;
};

type UploadPanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: UploadDraft) => Promise<void> | void;
};

const imageExt = /\.(jpg|jpeg|png|webp|gif)$/i;
const videoExt = /\.(mp4|webm|mov|m4v)$/i;

const parseLink = (
  rawUrl: string,
  preferredKind: 'image' | 'video',
): Omit<UploadDraft, 'title' | 'creator' | 'summary' | 'openingPrice'> => {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (imageExt.test(lower)) return { mediaKind: 'image', mediaUrl: url, platform: 'קישור', sourceLink: url };
  if (videoExt.test(lower)) return { mediaKind: 'video', mediaUrl: url, platform: 'קישור', sourceLink: url };

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

  return { mediaKind: preferredKind, mediaUrl: url, platform: 'קישור', sourceLink: url };
};

export default function UploadPanel({ open, onClose, onSubmit }: UploadPanelProps) {
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
  const [file, setFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState('');
  const [statusLine, setStatusLine] = useState('בחרו קובץ או קישור');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  const applyLink = () => {
    if (!linkInput.trim()) return;
    const parsed = parseLink(linkInput, preferredKind);
    setFile(undefined);
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(parsed.mediaUrl);
    setMediaKind(parsed.mediaKind);
    setMediaUrl(parsed.mediaUrl);
    setSourceLink(parsed.sourceLink ?? '');
    setPlatform(parsed.platform);
    setStatusLine(`מקור ${parsed.platform}`);
  };

  const onFilePick = (pickedFile: File | undefined) => {
    if (!pickedFile) return;
    const url = URL.createObjectURL(pickedFile);
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    const isVideo = pickedFile.type.startsWith('video/');
    setPreviewUrl(url);
    setFile(pickedFile);
    setMediaKind(isVideo ? 'video' : 'image');
    setMediaUrl(url);
    setSourceLink('');
    setPlatform('גלריה');
    setStatusLine(`${isVideo ? 'וידאו' : 'תמונה'} מהגלריה`);
  };

  const resetForm = () => {
    setTitle('');
    setCreator('');
    setSummary('');
    setOpeningPrice('500');
    setPreferredKind('video');
    setLinkInput('');
    setMediaKind('video');
    setMediaUrl('');
    setSourceLink('');
    setPlatform('גלריה');
    setFile(undefined);
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setStatusLine('בחרו קובץ או קישור');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericPrice = Math.round(Number(openingPrice));
    if (!title.trim() || !creator.trim() || !summary.trim() || !mediaUrl.trim()) return;
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;

    setIsSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        creator: creator.trim(),
        summary: summary.trim(),
        openingPrice: numericPrice,
        mediaKind,
        mediaUrl,
        sourceLink: sourceLink || undefined,
        platform,
        file,
      });
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section
      className="fixed inset-0 z-[70] bg-[#020313]/95 p-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">העלאה</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 p-2 text-white/85">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
          <form onSubmit={submit} className="holo-panel overflow-auto rounded-3xl p-4">
            <div className="space-y-3">
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
                rows={3}
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
                  placeholder="קישור טיקטוק אינסטגרם פייסבוק X או ישיר"
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
                disabled={isSaving}
                className="w-full rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/18 px-4 py-2 text-sm font-semibold text-[#E8FF9A] disabled:opacity-40"
              >
                {isSaving ? 'שומר...' : 'העלאה לפיד'}
              </button>
            </div>
          </form>

          <div className="holo-panel overflow-hidden rounded-3xl p-3">
            <p className="mb-2 text-xs text-white/70">תצוגה</p>
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {!previewUrl && <div className="absolute inset-0 grid place-items-center text-sm text-white/45">אין תצוגה</div>}
              {previewUrl && mediaKind === 'image' && <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />}
              {previewUrl && mediaKind === 'video' && (
                <video src={previewUrl} className="h-full w-full object-cover" controls playsInline autoPlay muted={false} />
              )}
              {previewUrl && mediaKind === 'embed' && (
                <iframe title="embed-preview" src={previewUrl} className="h-full w-full border-0" allow="autoplay; encrypted-media; clipboard-write" />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
