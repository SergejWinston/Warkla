import { useNavigate } from 'react-router-dom'
import { useSubjects } from '../hooks'
import Layout from '../components/Layout'

const withAlpha = (color, alphaSuffix) => {
  if (typeof color !== 'string') return null
  if (color.startsWith('#') && color.length === 7) {
    return `${color}${alphaSuffix}`
  }
  return color
}

const getCardStyle = (color) => ({
  borderColor: color || '#2d1b4e',
  backgroundColor: withAlpha(color, '1A') || '#FFF8F0',
})

export default function TaskBank() {
  const navigate = useNavigate()
  const { subjects, isLoading, error, refetch } = useSubjects()

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4 animate-slide-down">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 mb-6 flex items-center gap-2"
            >
              <span>←</span>
              Назад к разделам
            </button>
            <h1 className="font-cute text-4xl font-bold text-pixel-dark flex items-center gap-3">
              <span className="text-5xl">🗂️</span>
              Банк заданий
            </h1>
            <p className="font-main text-pixel-dark/70 mt-3">Каталог доступных предметов. Для решения открой раздел предметов на главной странице.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-3 bg-pixel-pink hover:bg-pixel-pink-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
          >
            Перейти к предметам 🚀
          </button>
        </div>

        {isLoading && (
          <div className="bg-pixel-cream border-4 border-pixel-dark p-10 text-center animate-bounce-slow">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <div className="font-cute text-xl text-pixel-dark">Загрузка предметов...</div>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-pixel-red/20 border-4 border-pixel-red-dark p-8 animate-wiggle">
            <p className="font-main font-semibold text-pixel-red-dark mb-5 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Не удалось загрузить список предметов.
            </p>
            <button
              onClick={refetch}
              className="px-5 py-3 bg-pixel-red-dark hover:bg-pixel-red border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-white transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
            >
              Повторить 🔄
            </button>
          </div>
        )}

        {!isLoading && !error && subjects.length === 0 && (
          <div className="bg-pixel-cream border-4 border-pixel-dark p-10 text-center">
            <div className="text-6xl mb-4 animate-bounce-slow">📚</div>
            <p className="font-cute text-xl text-pixel-dark">Предметы пока не найдены.</p>
          </div>
        )}

        {!isLoading && !error && subjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover p-6 transform hover:translate-x-1 hover:translate-y-1 transition-all duration-100"
                style={getCardStyle(subject.color)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">📖</span>
                  <p className="text-xs font-main uppercase tracking-wider text-pixel-dark/60">Предмет</p>
                </div>
                <h3 className="font-cute text-xl font-bold text-pixel-dark mb-4">{subject.name}</h3>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-pixel-blue hover:bg-pixel-blue-dark border-3 border-pixel-dark shadow-pixel-sm hover:shadow-pixel font-main font-bold text-sm text-pixel-dark transition-all duration-100 transform hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  Открыть в разделе предметов →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
