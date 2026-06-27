import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Validate = () => {
  const { t } = useTranslation();
  const { skillName } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState('generating'); // generating, questions, evaluating, result
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    generateQuestions();
  }, [skillName]);

  const generateQuestions = async () => {
    setStage('generating');
    try {
      const res = await api.post('/validate/questions', {
        skillName: decodeURIComponent(skillName),
        experienceLevel: 'Intermediate'
      });
      setQuestions(res.data.questions);
      setSessionId(res.data.sessionId);
      setStage('questions');
    } catch (error) {
      toast.error('Failed to generate questions');
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    const answerArray = questions.map((_, i) => answers[i] || '');
    const unanswered = answerArray.filter(a => !a).length;
    
    if (unanswered > 0) {
      toast.error(`Please answer all questions (${unanswered} unanswered)`);
      return;
    }

    setStage('evaluating');
    try {
      const res = await api.post('/validate/submit', {
        sessionId,
        answers: answerArray
      });
      setResult(res.data.result);
      setStage('result');
      
      if (res.data.result.passed) {
        // Trigger confetti
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (error) {
      toast.error('Failed to evaluate answers');
      setStage('questions');
    }
  };

  if (stage === 'generating') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">{t('validate.generating')}</h2>
          <p className="text-slate-400">Preparing 10 questions for: <span className="text-primary">{decodeURIComponent(skillName)}</span></p>
        </motion.div>
      </div>
    );
  }

  if (stage === 'evaluating') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">{t('validate.evaluating')}</h2>
          <p className="text-slate-400">Please wait while we evaluate your answers...</p>
        </motion.div>
      </div>
    );
  }

  if (stage === 'result') {
    return (
      <div className="min-h-screen bg-dark-bg py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 border border-dark-border text-center"
          >
            {result.passed ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                  <Award className="text-success" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-success mb-2">{t('validate.passed')}</h2>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center">
                  <XCircle className="text-secondary" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-secondary mb-2">{t('validate.failed')}</h2>
              </>
            )}

            {/* Score Ring */}
            <div className="relative w-32 h-32 mx-auto my-6">
              <svg className="transform -rotate-90" width="128" height="128">
                <circle cx="64" cy="64" r="56" stroke="rgba(108,99,255,0.2)" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="64" cy="64" r="56"
                  stroke={result.passed ? '#10B981' : '#FF6584'}
                  strokeWidth="8" fill="none" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - result.score / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{result.score}%</span>
              </div>
            </div>

            <p className="text-slate-300 mb-4">{result.feedback}</p>
            
            {!result.passed && (
              <p className="text-sm text-slate-400 mb-6">{t('validate.retry')}</p>
            )}

            {/* Per-question feedback */}
            {result.perQuestion && (
              <div className="mt-6 text-left space-y-2">
                <h3 className="font-semibold text-white mb-3">{t('validate.feedback')}</h3>
                {result.perQuestion.map((pq, i) => (
                  <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${pq.correct ? 'bg-success/10' : 'bg-red-500/10'}`}>
                    {pq.correct ? <CheckCircle size={16} className="text-success mt-0.5 shrink-0" /> : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-xs text-slate-300">Q{i + 1}: {pq.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all glow-primary"
            >
              {t('validate.continue')}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Questions stage
  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{t('validate.title')}</h1>
          <p className="text-slate-400 mt-1">
            Skill: <span className="text-primary font-medium">{decodeURIComponent(skillName)}</span>
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-5 border border-dark-border"
            >
              <p className="text-sm text-slate-400 mb-2">
                {t('validate.question')} {index + 1} {t('validate.of')} {questions.length}
              </p>
              <p className="text-white font-medium mb-4">{q.question}</p>
              
              <div className="space-y-2">
                {q.options.map((option, optIdx) => {
                  const optionLetter = option.charAt(0);
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        answers[index] === optionLetter
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-dark-border text-slate-300 hover:border-primary/50 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${index}`}
                        value={optionLetter}
                        checked={answers[index] === optionLetter}
                        onChange={() => setAnswers(p => ({ ...p, [index]: optionLetter }))}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        answers[index] === optionLetter ? 'border-primary' : 'border-slate-500'
                      }`}>
                        {answers[index] === optionLetter && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-105 glow-primary"
          >
            {t('validate.submit')}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            {Object.keys(answers).length}/{questions.length} questions answered
          </p>
        </div>
      </div>
    </div>
  );
};

export default Validate;
