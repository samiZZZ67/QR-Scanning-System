import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Image as ImageIcon, Sparkles, RefreshCw, Wand2, Languages, Type } from 'lucide-react';
import { api } from '../../../api/client.js';
import Button from '../../../components/ui/Button.jsx';
import Card from '../../../components/ui/Card.jsx';
import Input from '../../../components/ui/Input.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';

const SUGGESTED_PROMPTS = [
  { label: 'Improve Doro Wot description', text: 'Write a premium description for "Doro Wot" describing the slow-cooked chicken, hard-boiled eggs, and the rich berbere spice blend.', task: 'writing' },
  { label: 'Translate menu to Amharic', text: 'Translate this item to Amharic: "Injera Combo Platter with various lentil wots."', task: 'translate', targetLanguage: 'Amharic' },
  { label: 'Write a welcome banner copy', text: 'Write a warm, luxury welcome banner description welcoming guests to Habesha Grand Hotel QR ordering system.', task: 'content' }
];

export default function AITab() {
  const [activeMode, setActiveMode] = useState('text'); // 'text' | 'image'
  const [notice, setNotice] = useState(null);

  // Text mode states
  const [task, setTask] = useState('writing'); // 'writing' | 'translate' | 'content'
  const [promptInput, setPromptInput] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [tone, setTone] = useState('elegant');
  const [textResult, setTextResult] = useState('');
  const [loadingText, setLoadingText] = useState(false);

  // Image mode states
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);

  const resultRef = useRef(null);

  const handleApplySuggested = (item) => {
    setPromptInput(item.text);
    setTask(item.task);
    if (item.targetLanguage) {
      setTargetLanguage(item.targetLanguage);
    }
  };

  const handleRunTextTask = async (e) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setLoadingText(true);
    setNotice(null);
    setTextResult('');

    try {
      const data = await api('/ai/groq', {
        method: 'POST',
        body: {
          task,
          prompt: promptInput.trim(),
          targetLanguage: task === 'translate' ? targetLanguage : undefined,
          tone: tone
        }
      });
      const text = data.text || ''
      const desplayText = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
      setTextResult(desplayText);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to generate response' });
    } finally {
      setLoadingText(false);
    }
  };

  const handleGenerateImage = async (e) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;
    setLoadingImage(true);
    setNotice(null);
    setGeneratedImageUrl('');
    setRevisedPrompt('');

    try {
      const data = await api('/ai/groq/image', {
        method: 'POST',
        body: {
          prompt: imagePrompt.trim()
        }
      });
      setGeneratedImageUrl(data.url || '');
      setRevisedPrompt(data.revisedPrompt || '');
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to generate image' });
    } finally {
      setLoadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Groq AI Assistant</h2>
          <p className="text-sm text-gold-muted mt-1">Generate high-quality menu copy, translate listings, or design food graphics.</p>
        </div>
        <div className="flex bg-surface p-1 rounded-xl border border-gold-muted/30">
          <button
            onClick={() => setActiveMode('text')}
            className={[
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              activeMode === 'text' ? 'bg-gold text-pale-light shadow-sm' : 'text-rough hover:text-gold'
            ].join(' ')}
          >
            <Type size={16} />
            Copywriting
          </button>
          <button
            onClick={() => setActiveMode('image')}
            className={[
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              activeMode === 'image' ? 'bg-gold text-pale-light shadow-sm' : 'text-rough hover:text-gold'
            ].join(' ')}
          >
            <ImageIcon size={16} />
            Food Graphics
          </button>
        </div>
      </div>

      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          className="my-3"
        />
      )}

      {activeMode === 'text' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form parameters */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-5 space-y-4">
              <h3 className="font-display font-semibold text-rough text-base">Assistant Controls</h3>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-rough">AI Task Type</label>
                <select
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full bg-surface border border-gold-muted rounded-xl px-3 py-2 text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="writing">Improve copy (Writing)</option>
                  <option value="translate">Translate listing</option>
                  <option value="content">Write new contents</option>
                </select>
              </div>

              {task === 'translate' && (
                <Input
                  label="Target Language"
                  placeholder="e.g. Amharic, Arabic, French"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                />
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-rough">Tone & Style</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-surface border border-gold-muted rounded-xl px-3 py-2 text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="elegant">Elegant & Premium (Luxury)</option>
                  <option value="informative">Descriptive & Detailed</option>
                  <option value="warm">Warm & Welcoming</option>
                  <option value="concise">Concise & Direct</option>
                </select>
              </div>
            </Card>

            {/* Suggestions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gold uppercase tracking-wider">Suggested Tasks</h4>
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplySuggested(item)}
                  className="w-full text-left bg-surface hover:bg-gold/5 border border-gold-muted/30 rounded-xl p-3 text-xs text-body transition-colors"
                >
                  <div className="font-semibold text-rough flex items-center gap-1">
                    {item.task === 'translate' ? <Languages size={12} className="text-gold" /> : <Sparkles size={12} className="text-gold" />}
                    {item.label}
                  </div>
                  <p className="mt-1 text-gold-muted line-clamp-2">{item.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form prompt & result */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="font-display font-semibold text-rough text-base">Write Prompt</h3>
              <form onSubmit={handleRunTextTask} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-rough">Input Copy / Instructions</label>
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    required
                    placeholder="Enter what you want Groq to translate, improve, or write..."
                    rows={6}
                    className="w-full bg-surface border border-gold-muted px-4 py-3 rounded-xl text-sm text-rough focus:outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={loadingText} disabled={!promptInput.trim()}>
                    <Wand2 size={16} className="mr-1.5" />
                    Process Copy
                  </Button>
                </div>
              </form>
            </Card>

            {/* Results card */}
            {textResult && (
              <Card ref={resultRef} className="p-5 border-l-4 border-l-gold bg-pale-light/50 space-y-3">
                <div className="flex items-center gap-2 text-gold font-semibold text-sm">
                  <Bot size={18} />
                  Groq Suggested Output
                </div>
                <div className="text-sm text-rough font-sans leading-relaxed whitespace-pre-line bg-surface p-4 rounded-xl border border-gold-muted/20 select-all">
                  {textResult}
                </div>
                <p className="text-[10px] text-gold-muted">Click the text box above to select and copy the text directly.</p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Prompt Form */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-5 space-y-4">
              <h3 className="font-display font-semibold text-rough text-base">Design Food Graphics</h3>
              <p className="text-xs text-gold-muted leading-relaxed">
                Describe the dish you want to generate. For high-quality results, specify the lighting, background, and photographic style.
              </p>
              <form onSubmit={handleGenerateImage} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-rough font-display">Graphic Prompt</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    required
                    placeholder="e.g. A realistic food photo of traditional Ethiopian Doro Wot with boiled egg and injera, top-down view, professional lighting, restaurant styling"
                    rows={6}
                    className="w-full bg-surface border border-gold-muted px-3 py-2.5 rounded-xl text-sm text-rough focus:outline-none focus:border-gold resize-none"
                  />
                </div>
                <Button type="submit" variant="primary" loading={loadingImage} disabled={!imagePrompt.trim()} className="w-full">
                  <Wand2 size={16} className="mr-1.5" />
                  Generate Image
                </Button>
              </form>
            </Card>
          </div>

          {/* Image generation result */}
          <div className="lg:col-span-2">
            {loadingImage ? (
              <Card className="flex flex-col items-center justify-center py-24 text-center">
                <LoadingSpinner size="lg" text="Groq is rendering your food graphic..." />
              </Card>
            ) : generatedImageUrl ? (
              <Card className="p-5 space-y-4">
                <h3 className="font-display font-semibold text-rough text-base flex items-center gap-2">
                  <Sparkles size={18} className="text-gold" />
                  Generated Graphic Result
                </h3>
                <div className="rounded-xl overflow-hidden aspect-video border border-gold-muted/30 max-w-xl mx-auto shadow-sm bg-pale">
                  <img
                    src={generatedImageUrl}
                    alt="Groq Food Generation"
                    className="w-full h-full object-cover"
                  />
                </div>
                {revisedPrompt && (
                  <div className="bg-surface p-3 rounded-lg border border-gold-muted/20 max-w-xl mx-auto">
                    <span className="text-xs font-semibold text-gold-muted uppercase">Revised prompt:</span>
                    <p className="text-xs text-body mt-1 leading-relaxed">{revisedPrompt}</p>
                  </div>
                )}
                <div className="flex justify-center pt-2">
                  <a
                    href={generatedImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-hover font-semibold transition-colors"
                  >
                    Open Image in New Tab
                  </a>
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center py-24 text-center text-gold-muted">
                <ImageIcon size={48} className="text-gold-muted/30 mb-2" />
                <p className="font-display font-medium text-rough text-lg">No Graphic Generated Yet</p>
                <p className="text-sm">Enter a graphic prompt on the left to invoke Groq image generator.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
