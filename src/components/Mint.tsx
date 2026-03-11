import { motion } from 'framer-motion';
import { Building2, Loader2, Upload } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinIcon } from './DripCoinIcon';

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
      setError('אפשר להעלות רק תמונה או וידאו');
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
      setError('יש לבחור קובץ ולכתוב שם לנכס');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('נדרשת התחברות כדי להנפיק נכס');
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

      toast.success('הנכס הונפק ונכנס למסחר');
      setFile(null);
      setPreviewUrl('');
      setTitle('');
      onMinted();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'ההנפקה נכשלה';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        <header className="rounded-[1.9rem] border border-white/10 bg-[#111111]/78 p-4 backdrop-blur-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2.5 py-1">
            <Building2 size={13} className="text-[#E5E7EB]/80" />
            <span className="text-[10px] font-semibold text-[#E5E7EB]/70">סטודיו הנפקת מסחר</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#E5E7EB]">הנפקת נכס חדשה</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#E5E7EB]/58">
            מסך הנפקה בתצורת דסק מקצועי: העלאת מדיה, כותרת מדויקת והנפקה מיידית לערך פתיחה קבוע.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#007AFF]/30 bg-[#007AFF]/12 px-3 py-1.5 text-[11px] font-semibold text-[#E5E7EB]">
            ערך פתיחה
            <span>500</span>
            <DripCoinIcon />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="group relative block overflow-hidden rounded-[1.8rem] border border-dashed border-white/20 bg-[#111111]/75 p-4 backdrop-blur-3xl">
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 z-20 cursor-pointer opacity-0" />
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-[1.3rem] border border-white/15">
                {isVideo ? (
                  <video src={previewUrl} controls className="max-h-[340px] w-full bg-black object-contain" />
                ) : (
                  <img src={previewUrl} alt="תצוגה מקדימה" className="max-h-[340px] w-full bg-black object-contain" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-center text-[11px] font-semibold text-[#E5E7EB]">
                  החלפה בלחיצה
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-9 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-[#020202]">
                  <Upload size={24} className="text-[#E5E7EB]/85" />
                </div>
                <p className="text-sm font-semibold text-[#E5E7EB]">העלה קובץ להנפקה</p>
                <p className="text-[11px] text-[#E5E7EB]/52">תמונה או וידאו בלבד</p>
              </div>
            )}
          </label>

          <div className="rounded-[1.8rem] border border-white/10 bg-[#111111]/78 p-4 backdrop-blur-3xl">
            <label className="mb-2 block text-[11px] font-semibold text-[#E5E7EB]/62">שם הנכס</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="לדוגמה: מניית פרימיום דיגיטלית"
              className="w-full rounded-[1.1rem] border border-white/12 bg-black/35 px-4 py-3 text-sm font-medium text-[#E5E7EB] outline-none transition focus:border-[#007AFF]/55"
            />
          </div>

          {error && <div className="rounded-2xl border border-[#FF3B30]/40 bg-[#FF3B30]/12 px-3 py-2 text-xs font-semibold text-[#E5E7EB]">{error}</div>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-[#007AFF]/50 bg-[#007AFF]/18 px-4 py-3 text-sm font-semibold text-[#E5E7EB] transition hover:bg-[#007AFF]/24 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {isSubmitting ? 'הנפקה מתבצעת' : 'הנפק לזירה'}
          </motion.button>
        </form>
      </div>
    </section>
  );
}
