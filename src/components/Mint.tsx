import { motion } from 'framer-motion';
import { Building2, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinIcon } from './DripCoin';

type MintProps = {
  onMinted: () => void;
};

export default function Mint({ onMinted }: MintProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isVideo = file?.type.startsWith('video/');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;
    if (!nextFile.type.startsWith('image/') && !nextFile.type.startsWith('video/')) {
      setError('אפשר להעלות רק תמונה או וידאו.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !title.trim()) {
      setError('צריך לבחור קובץ ולכתוב שם לנכס.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('נדרשת התחברות כדי להנפיק נכס.');
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const randomId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const storagePath = `uploads/${Date.now()}-${randomId}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('drip_media').upload(storagePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('drip_media').getPublicUrl(storagePath);
      const mediaUrl = publicData.publicUrl;

      const attempts: Array<{ table: string; payload: Record<string, unknown> }> = [
        {
          table: 'drip_assets',
          payload: {
            title: title.trim(),
            media_url: mediaUrl,
            owner_id: user.id,
            creator_id: user.id,
            current_value: 500,
            initial_value: 500,
            hype_level: 100,
          },
        },
        {
          table: 'assets',
          payload: {
            media_url: mediaUrl,
            owner: 'את/ה',
            price: 500,
            hype: 100,
            media_type: file.type,
          },
        },
      ];

      let lastError: Error | null = null;
      for (const attempt of attempts) {
        const { error: insertError } = await supabase.from(attempt.table).insert(attempt.payload);
        if (!insertError) {
          lastError = null;
          break;
        }
        lastError = insertError;
      }

      if (lastError) throw lastError;

      toast.success('ההנפקה הושלמה והנכס נכנס למסחר.');
      setFile(null);
      setPreviewUrl('');
      setTitle('');
      onMinted();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'ההנפקה נכשלה. נסה שוב.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          <div className="mb-2 flex items-center gap-2 text-cyan-200">
            <Building2 size={16} />
            <span className="text-[11px] font-black tracking-[0.18em]">רצפת הנפקות</span>
          </div>
          <h1 className="text-2xl font-black text-white">הנפקה חדשה לזירה</h1>
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            מסך ההנפקה מעוצב כמו דסק מסחר מקצועי: בחירת מדיה, שם נכס, ועלייה מיידית לערך פתיחה.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
            ערך פתיחה
            <span className="font-black text-white">500</span>
            <DripCoinIcon className="h-4" />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="group relative block overflow-hidden rounded-3xl border border-dashed border-cyan-300/45 bg-white/[0.02] p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 z-20 cursor-pointer opacity-0" />
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/15">
                {isVideo ? (
                  <video src={previewUrl} controls className="max-h-[340px] w-full bg-black object-contain" />
                ) : (
                  <img src={previewUrl} alt="תצוגה מקדימה" className="max-h-[340px] w-full bg-black object-contain" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-center text-xs font-black text-white">
                  החלפה בלחיצה
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-10 text-center text-white/80">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                  <UploadCloud size={30} />
                </div>
                <p className="text-sm font-black">גרור או בחר קובץ מדיה להנפקה</p>
                <p className="text-[11px] text-white/55">תמונה או וידאו • איכות גבוהה תייצר ביקוש גבוה יותר</p>
              </div>
            )}
          </label>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-2xl">
            <label className="mb-2 block text-[11px] font-black text-white/55">שם הנכס</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="לדוגמה: מניית זהב דיגיטלית"
              className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300/45"
            />
          </div>

          {error && <div className="rounded-2xl border border-rose-300/35 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100">{error}</div>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/55 bg-gradient-to-r from-cyan-300 via-emerald-300 to-yellow-300 px-4 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isSubmitting ? 'הנפקה מתבצעת...' : 'הנפק עכשיו לזירה'}
          </motion.button>
        </form>
      </div>
    </section>
  );
}
