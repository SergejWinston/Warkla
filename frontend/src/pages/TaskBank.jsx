import { useNavigate } from 'react-router-dom'
import { useSubjects } from '../hooks'

const withAlpha = (color, alphaSuffix) => {
  if (typeof color !== 'string') return null
  if (color.startsWith('#') && color.length === 7) {
    return `${color}${alphaSuffix}`
  }
  return color
}

const getCardStyle = (color) => ({
  borderColor: color || '#cbd5e1',
  backgroundColor: withAlpha(color, '1A') || '#f8fafc',
})

export default function TaskBank() {
  const navigate = useNavigate()
  const { subjects, isLoading, error, refetch } = useSubjects()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sky-600 hover:text-sky-700 font-medium mb-3"
            >
              ← Назад к разделам
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Банк заданий</h1>
            <p className="text-slate-600 mt-2">Каталог доступных предметов. Для решения открой раздел предметов на главной странице.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition"
          >
            Перейти к предметам
          </button>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Загрузка предметов...</div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-rose-700 mb-4">Не удалось загрузить список предметов.</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition"
            >
              Повторить
            </button>
          </div>
        )}

        {!isLoading && !error && subjects.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Предметы пока не найдены.
          </div>
        )}

        {!isLoading && !error && subjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-xl border p-5"
                style={getCardStyle(subject.color)}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Предмет</p>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{subject.name}</h3>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 text-sm font-semibold text-sky-700 hover:text-sky-800"
                >
                  Открыть в разделе предметов
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
