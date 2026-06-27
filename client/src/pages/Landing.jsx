import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Zap, ShieldCheck, MessageCircle, Heart } from 'lucide-react';

const floatingSkills = [
  'JavaScript', 'Python', 'Guitar', 'Yoga', 'Photography', 'React',
  'Cooking', 'Spanish', 'Figma', 'Piano', 'Marketing', 'French'
];

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            <span className="font-bold text-xl gradient-text">SkillSwap</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              {t('landing.login')}
            </Link>
            <Link to="/register" className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 glow-primary">
              {t('landing.get_started')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Floating skill tags */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingSkills.map((skill, i) => (
            <motion.div
              key={skill}
              className="absolute px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary/60 border border-primary/20"
              style={{
                left: `${10 + (i * 7) % 80}%`,
                top: `${15 + (i * 13) % 60}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.3
              }}
            >
              {skill}
            </motion.div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight"
          >
            <span className="gradient-text">{t('landing.hero_title')}</span>
            <br />
            <span className="text-white">{t('landing.hero_subtitle')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto"
          >
            {t('landing.hero_desc')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="px-8 py-4 bg-primary hover:bg-primary/80 text-white rounded-xl text-lg font-semibold transition-all hover:scale-105 glow-primary flex items-center gap-2"
            >
              {t('landing.get_started')}
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-dark-border hover:border-primary/50 text-slate-300 hover:text-white rounded-xl text-lg font-medium transition-all"
            >
              {t('landing.login')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            {t('landing.how_it_works')}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '👤', title: t('landing.step1_title'), desc: t('landing.step1_desc'), num: '01' },
              { icon: '🎯', title: t('landing.step2_title'), desc: t('landing.step2_desc'), num: '02' },
              { icon: '🤝', title: t('landing.step3_title'), desc: t('landing.step3_desc'), num: '03' }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="glass rounded-2xl p-8 text-center relative overflow-hidden group hover:border-primary/50 border border-dark-border transition-all"
              >
                <div className="absolute top-4 right-4 text-4xl font-black text-primary/10 group-hover:text-primary/20 transition-colors">
                  {step.num}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-dark-surface/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            {t('landing.features_title')}
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: t('landing.feature1_title'), desc: t('landing.feature1_desc'), color: 'text-primary' },
              { icon: ShieldCheck, title: t('landing.feature2_title'), desc: t('landing.feature2_desc'), color: 'text-success' },
              { icon: MessageCircle, title: t('landing.feature3_title'), desc: t('landing.feature3_desc'), color: 'text-blue-400' },
              { icon: Heart, title: t('landing.feature4_title'), desc: t('landing.feature4_desc'), color: 'text-secondary' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 border border-dark-border hover:border-primary/30 transition-all group"
              >
                <feature.icon className={`${feature.color} mb-4`} size={32} />
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to start <span className="gradient-text">swapping skills</span>?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join thousands of learners and teachers exchanging knowledge for free.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/80 text-white rounded-xl text-lg font-semibold transition-all hover:scale-105 glow-primary"
          >
            Join SkillSwap Today
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <span className="font-bold gradient-text">SkillSwap</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; 2024 SkillSwap. Trade What You Know. Learn What You Don't.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
