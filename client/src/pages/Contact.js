import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MessageCircle, Github, Twitter, Send, LifeBuoy, Briefcase, Bug, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageShell, SectionCard, SectionGrid } from '../components/Page/PageShell';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const contactMethods = useMemo(
    () => [
      {
        icon: <Mail size={18} />,
        title: t('contact.methods.email.title'),
        description: 'Best for account issues, product questions, and structured support requests.',
        action: 'mailto:i@mail.iii.pics',
        contact: t('contact.methods.email.contact'),
      },
      {
        icon: <Github size={18} />,
        title: t('contact.methods.github.title'),
        description: 'Best for reproducible bugs, technical reports, and implementation detail.',
        action: 'https://github.com/renqw2023',
        contact: t('contact.methods.github.contact'),
      },
      {
        icon: <Twitter size={18} />,
        title: t('contact.methods.twitter.title'),
        description: 'Best for public updates, launch notes, and lightweight outreach.',
        action: 'https://x.com/renqw5271',
        contact: t('contact.methods.twitter.contact'),
      },
      {
        icon: <MessageCircle size={18} />,
        title: t('contact.methods.wechat.title'),
        description: 'Best for quicker back-and-forth when email is too slow.',
        action: null,
        contact: t('contact.methods.wechat.contact'),
      },
    ],
    [t],
  );

  const queues = [
    { icon: <LifeBuoy size={18} />, title: 'General support', note: 'Login issues, workflow questions, page confusion' },
    { icon: <Briefcase size={18} />, title: 'Business inquiries', note: 'Partnerships, licensing, and collaboration' },
    { icon: <Bug size={18} />, title: 'Bug reports', note: 'Steps to reproduce, screenshots, expected vs actual' },
    { icon: <CreditCard size={18} />, title: 'Billing help', note: 'Credits, payments, invite or account status' },
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(t('contact.messages.error'));
      return;
    }

    const subject = encodeURIComponent(`[III.PICS] ${formData.subject}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
    );

    window.location.href = `mailto:i@mail.iii.pics?subject=${subject}&body=${body}`;
    toast.success('Your email draft is ready.');
  };

  return (
    <PageShell
      showHeader={false}
      width="2xl"
      actions={
        <>
          <a href="mailto:i@mail.iii.pics" className="btn btn-primary">
            Email Support
          </a>
          <a href="https://github.com/renqw2023" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            Open GitHub
          </a>
        </>
      }
    >
      <SectionGrid columns="two">
        <SectionCard icon={<Send size={20} />} title="Write to the team" description="Submitting this form opens a prefilled email draft so your request goes to a real channel immediately.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input id="contact-name" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} className="input" placeholder={t('contact.form.namePlaceholder')} />
              <input id="contact-email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} className="input" placeholder={t('contact.form.emailPlaceholder', 'Your email')} />
            </div>
            <input id="contact-subject" name="subject" autoComplete="off" value={formData.subject} onChange={handleInputChange} className="input" placeholder={t('contact.form.subjectPlaceholder')} />
            <textarea id="contact-message" name="message" autoComplete="off" value={formData.message} onChange={handleInputChange} rows={7} className="textarea" placeholder={t('contact.form.messagePlaceholder')} />
            <button type="submit" className="btn btn-primary">
              <Send className="mr-2 h-4 w-4" />
              Open Email Draft
            </button>
          </form>
        </SectionCard>

        <SectionCard icon={<LifeBuoy size={20} />} title="Choose the right queue" description="Routing the request well makes response times better than adding more decorative UI.">
          <div className="space-y-3">
            {queues.map((queue) => (
              <div
                key={queue.title}
                className="rounded-2xl border px-4 py-3"
                style={{ borderColor: 'rgba(148, 163, 184, 0.18)', backgroundColor: 'rgba(248,250,252,0.72)' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--accent-primary)' }}>{queue.icon}</span>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {queue.title}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {queue.note}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </SectionGrid>

      <SectionCard icon={<MessageCircle size={20} />} title="Contact methods" description="Use the channel that best matches the kind of response you need.">
        <SectionGrid columns="four">
          {contactMethods.map((method) => {
            const content = (
              <>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-primary)' }}
                >
                  {method.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {method.title}
                </h3>
                <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  {method.description}
                </p>
                <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {method.contact}
                </p>
              </>
            );

            if (method.action) {
              return (
                <a
                  key={method.title}
                  href={method.action}
                  target={method.action.startsWith('http') ? '_blank' : undefined}
                  rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="rounded-[22px] border p-5 no-underline transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)' }}
                >
                  {content}
                </a>
              );
            }

            return (
              <div
                key={method.title}
                className="rounded-[22px] border p-5"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)' }}
              >
                {content}
              </div>
            );
          })}
        </SectionGrid>
      </SectionCard>
    </PageShell>
  );
};

export default Contact;
