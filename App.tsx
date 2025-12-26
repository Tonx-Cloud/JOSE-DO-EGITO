// App.tsx
import React, { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            José do Egito
          </h1>
          <p className="text-white/80 text-center mb-8">
            Intérprete de Sonhos
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white mb-2">Seu Nome:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Gênero:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Conte seu Sonho:</label>
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 h-32 resize-none"
                placeholder="Descreva seu sonho em detalhes..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
                disabled={isLoading}
              >
                {isRecording ? '⏹ Parar Gravação' : '🎤 Gravar Sonho'}
              </button>

              <button
                onClick={handleInterpret}
                disabled={isLoading || !name.trim() || !dreamText.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Interpretando...' : '✨ Interpretar Sonho'}
              </button>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Interpretação:</h2>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-500/30 ml-8'
                      : 'bg-blue-500/30 mr-8'
                  }`}
                >
                  <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
