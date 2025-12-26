// App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { interpretDream, transcribeAudio } from './services/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('masculino');
  const [dreamText, setDreamText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup da síntese de fala ao desmontar
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleInterpret = async () => {
    if (!name.trim() || !dreamText.trim()) {
      alert('Por favor, preencha seu nome e descreva seu sonho.');
      return;
    }

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: dreamText };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const interpretation = await interpretDream(name, gender, dreamText);
      const assistantMessage: Message = { role: 'assistant', content: interpretation };
      setMessages((prev) => [...prev, assistantMessage]);
      setDreamText('');
    } catch (error) {
      console.error('Erro ao interpretar:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao interpretar seu sonho. Tente novamente.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            setIsLoading(true);
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            setDreamText(transcription);
          } catch (error) {
            console.error('Erro ao transcrever:', error);
            alert('Erro ao transcrever o áudio. Tente novamente.');
          } finally {
            setIsLoading(false);
          }
        };
        
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const speakInterpretation = (text: string) => {
    // Cancelar fala anterior se existir
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      speechSynthesisRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      speechSynthesisRef.current = null;
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePauseSpeech = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    speechSynthesisRef.current = null;
  };

  const newDream = () => {
    setDreamText('');
    setMessages([]);
    stopSpeech();
  };

  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === 'assistant');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-6 text-center">
          <div className="text-6xl mb-3">🌙</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            José do Egito
          </h1>
          <p className="text-white/90 text-xl">
            Intérprete de Sonhos
          </p>
        </div>

        {/* Formulário ou Resultado */}
        {messages.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 space-y-5">
            {/* Nome */}
            <div>
              <label className="block text-white text-xl font-semibold mb-3">
                👤 Seu Nome:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 text-xl rounded-2xl bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-purple-400 border-2 border-white/30"
                placeholder="Digite seu nome"
              />
            </div>

            {/* Gênero */}
            <div>
              <label className="block text-white text-xl font-semibold mb-3">
                ⚧ Gênero:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGender('masculino')}
                  className={`py-4 px-6 text-xl rounded-2xl font-semibold transition-all border-2 ${
                    gender === 'masculino'
                      ? 'bg-blue-500 text-white border-blue-300 scale-105'
                      : 'bg-white/20 text-white border-white/30'
                  }`}
                >
                  Masculino
                </button>
                <button
                  onClick={() => setGender('feminino')}
                  className={`py-4 px-6 text-xl rounded-2xl font-semibold transition-all border-2 ${
                    gender === 'feminino'
                      ? 'bg-pink-500 text-white border-pink-300 scale-105'
                      : 'bg-white/20 text-white border-white/30'
                  }`}
                >
                  Feminino
                </button>
              </div>
            </div>

            {/* Sonho */}
            <div>
              <label className="block text-white text-xl font-semibold mb-3">
                💭 Conte seu Sonho:
              </label>
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                className="w-full px-6 py-4 text-xl rounded-2xl bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-purple-400 h-40 resize-none border-2 border-white/30"
                placeholder="Descreva seu sonho aqui..."
              />
            </div>

            {/* Botões */}
            <div className="space-y-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full py-5 text-2xl rounded-2xl font-bold transition-all shadow-lg ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white border-2 border-white/30`}
                disabled={isLoading}
              >
                {isRecording ? '⏹ Parar Gravação' : '🎤 Gravar Sonho'}
              </button>

              <button
                onClick={handleInterpret}
                disabled={isLoading || !name.trim() || !dreamText.trim()}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-5 text-2xl rounded-2xl font-bold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30"
              >
                {isLoading ? '⏳ Interpretando...' : '✨ Interpretar Sonho'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resultado da Interpretação */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  📜 Interpretação
                </h2>
              </div>

              {lastAssistantMessage && (
                <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl p-6 border-2 border-white/20">
                  <p className="text-white text-xl leading-relaxed whitespace-pre-wrap">
                    {lastAssistantMessage.content}
                  </p>
                </div>
              )}

              {/* Controles de Áudio */}
              {lastAssistantMessage && (
                <div className="mt-6 space-y-4">
                  {!isSpeaking ? (
                    <button
                      onClick={() => speakInterpretation(lastAssistantMessage.content)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-5 text-2xl rounded-2xl font-bold transition-all shadow-lg border-2 border-white/30"
                    >
                      🔊 Ouvir Interpretação
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={togglePauseSpeech}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-5 text-2xl rounded-2xl font-bold transition-all shadow-lg border-2 border-white/30"
                      >
                        {isPaused ? '▶️ Continuar' : '⏸ Pausar'}
                      </button>
                      <button
                        onClick={stopSpeech}
                        className="bg-red-500 hover:bg-red-600 text-white py-5 text-2xl rounded-2xl font-bold transition-all shadow-lg border-2 border-white/30"
                      >
                        ⏹ Parar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Botão Novo Sonho */}
              <button
                onClick={newDream}
                className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-5 text-2xl rounded-2xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg border-2 border-white/30"
              >
                🌟 Interpretar Novo Sonho
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white/70 text-lg">
          <p>✨ Compartilhe seus sonhos e encontre significado ✨</p>
        </div>
      </div>
    </div>
  );
}
