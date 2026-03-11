import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import {
  Upload,
  X,
  Video,
  Copy,
  Sparkles,
  Plus,
  CheckCircle2,
  FileImage,
  SlidersHorizontal,
  Send,
} from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { enhancedPostAPI, clearAPICache } from '../services/enhancedApi';
import { useTranslation } from 'react-i18next';
import { DetailList, PageShell, SectionCard, SectionGrid } from '../components/Page/PageShell';

const CREATOR_GUIDE = [
  'Start with the strongest 1-3 media files first so the post reads clearly in feeds.',
  'Use the title for the outcome, then keep description for process notes and prompt context.',
  'Treat parameters as reusable building blocks that others can copy into their next run.',
];

const PARAMETER_TIPS = [
  { label: 'Sref', value: 'Visual anchor', description: 'Use when the result should stay close to a reference style.' },
  { label: 'Stylize', value: 'Prompt intensity', description: 'Higher values lean harder into Midjourney interpretation.' },
  { label: 'Chaos', value: 'Variation spread', description: 'Raise this when you want less predictable generations.' },
  { label: 'Seed', value: 'Reproducibility', description: 'Keep it when you expect to revisit the same composition.' },
];

const CreatePost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewParams, setPreviewParams] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const watchedParams = watch([
    'sref',
    'style',
    'stylize',
    'chaos',
    'aspect',
    'version',
    'videoVersion',
    'quality',
    'seed',
    'other',
  ]);

  const descriptionLength = watch('description')?.length || 0;

  useEffect(() => {
    const params = [];
    const [sref, style, stylize, chaos, aspect, version, videoVersion, quality, seed, other] = watchedParams;

    if (sref) params.push(`--sref ${sref}`);
    if (style) params.push(`--style ${style}`);
    if (stylize) params.push(`--stylize ${stylize}`);
    if (chaos) params.push(`--chaos ${chaos}`);
    if (aspect) params.push(`--ar ${aspect}`);
    if (version) params.push(`--v ${version}`);
    if (videoVersion) params.push(`--video ${videoVersion}`);
    if (quality) params.push(`--q ${quality}`);
    if (seed) params.push(`--seed ${seed}`);
    if (other) params.push(other);

    setPreviewParams(params.join(' '));
  }, [watchedParams]);

  const uploadSummary = useMemo(
    () => [
      { label: 'Files in draft', value: String(files.length), note: files.length > 0 ? 'Ready for preview' : 'Add at least one media file' },
      { label: 'Tags', value: String(tags.length), note: tags.length > 0 ? 'Useful for discovery' : 'Optional but recommended' },
      { label: 'Prompt params', value: previewParams ? 'Configured' : 'Pending', note: previewParams ? 'Live preview available' : 'Add reusable run settings' },
    ],
    [files.length, previewParams, tags.length],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxFiles: 9,
    maxSize: 200 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video',
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors: rejectedErrors }) => {
        rejectedErrors.forEach((error) => {
          if (error.code === 'file-too-large') {
            toast.error(t('createPost.error.fileTooLarge'));
          } else if (error.code === 'file-invalid-type') {
            toast.error(t('createPost.error.fileTypeInvalid'));
          }
        });
      });
    },
  });

  useEffect(() => () => {
    files.forEach((item) => URL.revokeObjectURL(item.preview));
  }, [files]);

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag]);
    }
  };

  const removeTag = (index) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
        setTagInput('');
      }
    } else if (event.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const onSubmit = async (data) => {
    if (files.length === 0) {
      toast.error(t('createPost.error.noFiles'));
      return;
    }

    if (data.description && data.description.length > 2000) {
      toast.error(t('common.descriptionTooLong'));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append(
        'styleParams',
        JSON.stringify({
          sref: data.sref,
          style: data.style,
          stylize: data.stylize ? parseInt(data.stylize, 10) : undefined,
          chaos: data.chaos ? parseInt(data.chaos, 10) : undefined,
          aspect: data.aspect,
          version: data.version,
          videoVersion: data.videoVersion,
          quality: data.quality,
          seed: data.seed ? parseInt(data.seed, 10) : undefined,
          other: data.other,
        }),
      );
      formData.append('tags', tags.join(','));

      files.forEach(({ file }) => {
        formData.append('media', file);
      });

      const response = await enhancedPostAPI.createPost(formData);
      toast.success(t('createPost.success.published'));

      clearAPICache('post');

      files.forEach((item) => URL.revokeObjectURL(item.preview));
      setFiles([]);
      setTags([]);
      setTagInput('');
      setPreviewParams('');
      reset();

      navigate(`/post/${response.data.post._id}`);
    } catch (error) {
      console.error('Publish failed:', error);

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err) => {
            toast.error(`${err.path}: ${err.msg}`);
          });
        } else {
          toast.error(errorData.message || 'Invalid input, please check and try again');
        }
      } else if (error.response?.status === 413) {
        toast.error('File size exceeds limit');
      } else if (error.response?.status === 500) {
        toast.error(t('common.serverError'));
      } else {
        toast.error(error.response?.data?.message || t('createPost.error.publishFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      showHeader={false}
      width="2xl"
      aside={
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
              Publishing guide
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {CREATOR_GUIDE.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
          <DetailList items={PARAMETER_TIPS} />
        </div>
      }
    >
      <SectionGrid columns="three">
        {uploadSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border px-5 py-5"
            style={{
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(248,250,252,0.72))',
            }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {item.note}
            </p>
          </div>
        ))}
      </SectionGrid>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard
          icon={<FileImage size={20} />}
          title={t('createPost.upload.title')}
          description="Bring in the strongest files first. This section is designed to behave like a staging area before you write any metadata."
        >
          <div
            {...getRootProps()}
            className="rounded-[24px] border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer"
            style={{
              borderColor: isDragActive ? 'var(--accent-primary)' : 'rgba(148,163,184,0.3)',
              background: isDragActive ? 'rgba(99,102,241,0.08)' : 'rgba(248,250,252,0.72)',
            }}
          >
            <input {...getInputProps()} />
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ backgroundColor: 'rgba(99,102,241,0.08)', color: 'var(--accent-primary)' }}
            >
              <Upload className="h-8 w-8" />
            </div>
            <p className="mt-5 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isDragActive ? t('createPost.upload.dropToUpload') : t('createPost.upload.dragOrClick')}
            </p>
            <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {t('createPost.upload.supportedFiles')}
            </p>
          </div>

          {files.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {files.map((file, index) => (
                <div
                  key={`${file.file.name}-${index}`}
                  className="group relative overflow-hidden rounded-[22px] border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)' }}
                >
                  <div className="aspect-square bg-slate-100">
                    {file.type === 'image' ? (
                      <img src={file.preview} alt={t('createPost.upload.preview')} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Video className="h-10 w-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="min-w-0 truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {file.file.name}
                    </p>
                    <span className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: 'rgba(15,23,42,0.06)', color: 'var(--text-tertiary)' }}>
                      {file.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ backgroundColor: 'rgba(15,23,42,0.72)' }}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionGrid columns="two">
          <SectionCard
            icon={<Sparkles size={20} />}
            title={t('createPost.basicInfo.title')}
            description="Use this section to explain what the output is, what makes it interesting, and how someone else should discover it."
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.basicInfo.titleLabel')} *
                </label>
                <input
                  type="text"
                  {...register('title', { required: t('createPost.basicInfo.titleRequired') })}
                  className="input"
                  placeholder={t('createPost.basicInfo.titlePlaceholder')}
                />
                {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.basicInfo.descriptionLabel')}
                </label>
                <div className="relative">
                  <textarea
                    {...register('description', {
                      maxLength: {
                        value: 2000,
                        message: 'Description must be under 2000 characters',
                      },
                    })}
                    rows={5}
                    className={`textarea ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder={t('createPost.basicInfo.descriptionPlaceholder')}
                    maxLength={2000}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-slate-500">{descriptionLength}/2000</div>
                </div>
                {errors.description ? (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.basicInfo.tagsLabel')}
                </label>
                <div className="space-y-3">
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex items-center rounded-full border px-3 py-1 text-sm"
                          style={{ borderColor: 'rgba(59,130,246,0.2)', backgroundColor: 'rgba(59,130,246,0.08)', color: '#1d4ed8' }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="input"
                    placeholder={t('createPost.basicInfo.tagsPlaceholder')}
                  />
                  <input type="hidden" {...register('tags')} value={tags.join(',')} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<SlidersHorizontal size={20} />}
            title={t('createPost.styleParams.title')}
            description="Treat this as a reusable prompt recipe. Group only the parameters you actually want future readers to reuse."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.sref')}
                </label>
                <input type="text" {...register('sref')} className="input font-mono" placeholder="3311400918" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.style')}
                </label>
                <select {...register('style')} className="select">
                  <option value="">{t('createPost.styleParams.selectStyle')}</option>
                  <option value="raw">Raw</option>
                  <option value="expressive">Expressive</option>
                  <option value="cute">Cute</option>
                  <option value="scenic">Scenic</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.stylize')}
                </label>
                <input type="number" {...register('stylize')} className="input font-mono" placeholder="100" min="0" max="1000" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.chaos')}
                </label>
                <input type="number" {...register('chaos')} className="input font-mono" placeholder="0" min="0" max="100" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.aspect')}
                </label>
                <select {...register('aspect')} className="select">
                  <option value="">{t('createPost.styleParams.selectAspect')}</option>
                  <option value="1:1">{t('createPost.styleParams.aspect11')}</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">{t('createPost.styleParams.aspect169')}</option>
                  <option value="9:16">{t('createPost.styleParams.aspect916')}</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.version')}
                </label>
                <select {...register('version')} className="select">
                  <option value="">{t('createPost.styleParams.selectVersion')}</option>
                  <option value="7">Version 7</option>
                  <option value="6">Version 6</option>
                  <option value="5.2">Version 5.2</option>
                  <option value="5.1">Version 5.1</option>
                  <option value="5">Version 5</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.videoVersion')}
                </label>
                <select {...register('videoVersion')} className="select">
                  <option value="">{t('createPost.styleParams.selectVideoVersion')}</option>
                  <option value="v1">Midjourney Video V1</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.quality')}
                </label>
                <select {...register('quality')} className="select">
                  <option value="">{t('createPost.styleParams.selectQuality')}</option>
                  <option value="0.25">{t('createPost.styleParams.quality025')}</option>
                  <option value="0.5">0.5</option>
                  <option value="1">{t('createPost.styleParams.quality1')}</option>
                  <option value="2">{t('createPost.styleParams.quality2')}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.seed')}
                </label>
                <input type="number" {...register('seed')} className="input font-mono" placeholder="123456" />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('createPost.styleParams.otherParams')}
              </label>
              <input
                type="text"
                {...register('other')}
                className="input font-mono"
                placeholder={t('createPost.styleParams.otherParamsPlaceholder')}
              />
            </div>

            {previewParams ? (
              <div className="relative mt-5">
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('createPost.styleParams.preview')}
                </label>
                <div
                  className="rounded-[20px] border px-4 py-4 pr-14 font-mono text-sm"
                  style={{ borderColor: 'rgba(99,102,241,0.18)', backgroundColor: 'rgba(248,250,252,0.82)', color: 'var(--text-primary)' }}
                >
                  {previewParams}
                </div>
                <CopyToClipboard text={previewParams} onCopy={() => toast.success(t('createPost.styleParams.paramsCopied'))}>
                  <button
                    type="button"
                    className="absolute right-3 top-9 flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ borderColor: 'rgba(148,163,184,0.18)', backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--text-secondary)' }}
                    aria-label="Copy style parameters"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </CopyToClipboard>
              </div>
            ) : (
              <div
                className="mt-5 rounded-[20px] border border-dashed px-4 py-4 text-sm leading-7"
                style={{ borderColor: 'rgba(148,163,184,0.26)', color: 'var(--text-secondary)', backgroundColor: 'rgba(248,250,252,0.6)' }}
              >
                Add style parameters to generate a reusable command preview here.
              </div>
            )}
          </SectionCard>
        </SectionGrid>

        <SectionCard
          icon={<Send size={20} />}
          title="Review and publish"
          description="This final section keeps the workflow explicit: confirm the draft, then submit when everything reads cleanly."
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              <div
                className="flex items-start gap-3 rounded-[20px] border px-4 py-4"
                style={{ borderColor: 'rgba(16,185,129,0.18)', backgroundColor: 'rgba(16,185,129,0.06)' }}
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  Your current submit logic is unchanged, so this pass focuses on layout, readability, and guidance rather than backend behavior.
                </div>
              </div>
              <div className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                Double-check title clarity, media order, and whether your prompt parameters are worth copying. If not, simplify before publishing.
              </div>
            </div>

            <div className="space-y-3">
              <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary w-full">
                {t('createPost.buttons.cancel')}
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {t('createPost.buttons.publishing')}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createPost.buttons.publish')}
                  </>
                )}
              </button>
            </div>
          </div>
        </SectionCard>
      </form>
    </PageShell>
  );
};

export default CreatePost;
