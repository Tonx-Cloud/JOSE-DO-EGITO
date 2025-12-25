
// Adicionando a importação de React para corrigir o erro de namespace 'React'
import React, { useState, useRef, useEffect } from 'react';
import { AppView, Gender, UserState } from './types';
import { interpretDream, transcribeAudio } from './services/gemini';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('onboarding');
  const [user, setUser] = useState<UserState>({ name: '', gender: 'masculino' });
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cancela qualquer fala ativa ao desmontar o componente ou mudar de visão
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [view]);

  const cleanMarkdownForSpeech = (text: string) => {
    return text.replace(/[#*_~`>]/g, '').replace(/\n\n/g, '. ').replace(/\n/g, ' ').trim();
  };

  const speakInterpretation = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanMarkdownForSpeech(interpretation));
    utterance.lang = 'pt-BR';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(audioBlob));
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => setAudioBase64(reader.result?.toString().split(',')[1] || null);
        setView('review');
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microfone não disponível.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleTranscribe = async () => {
    if (!audioBase64) return;
    setIsLoading(true);
    try {
      const text = await transcribeAudio(audioBase64, 'audio/webm');
      setTranscription(text || '');
      setView('edit');
    } catch (error) {
      alert("Erro na transcrição.");
      setView('recording');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterpret = async () => {
    setIsLoading(true);
    setView('interpreting');
    try {
      const result = await interpretDream(user.name, user.gender, transcription);
      setInterpretation(result || 'Sem resposta.');
      setView('result');
    } catch (error) {
      setInterpretation("Erro ao analisar o sonho.");
      setView('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setInterpretation('');
    setView('onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#020617] text-slate-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900 rounded-full blur-[100px]"></div>
      </div>

      <header className="max-w-2xl w-full text-center mb-8 z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#D4AF37] leading-tight uppercase tracking-tight">
          - José do Egito -<br />
          Interpretador de sonhos
        </h1>
        <p className="text-slate-400 italic">"O sonho é a estrada real para o inconsciente." — Freud</p>
      </header>

      <main className="w-full max-w-xl glass p-8 rounded-[2rem] border border-white/10 shadow-2xl z-10 bg-slate-900/40 backdrop-blur-xl">
        {view === 'onboarding' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-[#D4AF37]">Bem-vindo à Sessão</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#D4AF37]"
                placeholder="Seu nome..."
              />
              <div className="flex gap-3">
                {['masculino', 'feminino'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setUser({ ...user, gender: g as Gender })}
                    className={`flex-1 py-4 rounded-2xl border capitalize transition-all ${user.gender === g ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'border-white/10'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={user.name.length < 2}
              onClick={() => setView('recording')}
              className="w-full py-5 rounded-2xl font-bold text-xl bg-[#D4AF37] text-slate-950 disabled:opacity-20 transition-all"
            >
              Iniciar Relato
            </button>
          </div>
        )}

        {view === 'recording' && (
          <div className="text-center space-y-10 py-6">
            <h2 className="text-2xl font-medium">Fale sobre seu sonho...</h2>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#D4AF37]'}`}
            >
              {isRecording ? <div className="w-8 h-8 bg-white rounded-sm" /> : <svg className="w-12 h-12 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>}
            </button>
            <p className="text-slate-400">{isRecording ? "Gravando..." : "Toque para gravar"}</p>
          </div>
        )}

        {view === 'review' && audioUrl && (
          <div className="space-y-8 text-center">
            <h2 className="text-2xl font-semibold text-[#D4AF37]">Revisar Relato</h2>
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex gap-4">
              <button onClick={() => setView('recording')} className="flex-1 py-4 border border-white/10 rounded-2xl">Refazer</button>
              <button onClick={handleTranscribe} className="flex-1 py-4 bg-[#D4AF37] text-slate-950 font-bold rounded-2xl">Analisar</button>
            </div>
          </div>
        )}

        {view === 'edit' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#D4AF37]">Sua Transcrição</h2>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="w-full h-48 bg-slate-950/50 border border-white/10 rounded-2xl p-5 outline-none focus:border-[#D4AF37] text-slate-200"
            />
            <button onClick={handleInterpret} className="w-full py-5 bg-[#D4AF37] text-slate-950 font-bold rounded-2xl">Confirmar Análise</button>
          </div>
        )}

        {view === 'interpreting' && (
          <div className="py-24 text-center space-y-8">
            <div className="w-16 h-16 border-4 border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin mx-auto"></div>
            <p className="text-xl text-[#D4AF37] animate-pulse">Sondando o inconsciente...</p>
          </div>
        )}

        {view === 'result' && (
          <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-5 bg-slate-950/40 rounded-2xl text-slate-400 italic text-sm">"{transcription}"</div>
            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#D4AF37] font-bold text-2xl">Parecer Analítico</h3>
                <button 
                  onClick={speakInterpretation} 
                  className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-red-500/20 text-red-500' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}
                  title={isSpeaking ? "Parar leitura" : "Ouvir interpretação"}
                >
                  {isSpeaking ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{interpretation}</div>
            </div>
            <button 
              onClick={handleNewSession} 
              className="w-full py-4 border border-[#D4AF37]/30 text-[#D4AF37] rounded-2xl hover:bg-[#D4AF37]/5 transition-colors"
            >
              Nova Sessão
            </button>
          </div>
        )}
      </main>

      {isLoading && view !== 'interpreting' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-[#D4AF37] rounded-full animate-spin"></div>
        </div>
      )}

      <footer className="mt-8 text-slate-600 text-[10px] tracking-widest uppercase">DREAM ANALYTICA • POWERED BY TON FIGUEREDO</footer>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }`}</style>
    </div>
  );
};

export default App;
