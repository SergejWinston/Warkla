import { useState } from 'react'
import { useSubjects, useThemes } from '../hooks'

export default function SubjectSelector({ onSelect }) {
  const { subjects, isLoading: subjectsLoading } = useSubjects()
  const [selectedSubject, setSelectedSubject] = useState(null)
  const { themes, isLoading: themesLoading } = useThemes(selectedSubject)

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject.id)
  }

  const handleThemeSelect = (theme = null) => {
    const subject = subjects.find((item) => item.id === selectedSubject)
    if (subject) {
      onSelect({
        subjectId: selectedSubject,
        subjectSlug: subject.slug,
        subjectName: subject.name,
        themeId: theme?.id || null,
      })
    }
  }

  if (subjectsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Загрузка предметов...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Выбери предмет</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelect(subject)}
              className={`p-4 rounded-lg font-medium transition border ${
                selectedSubject === subject.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200'
              }`}
              style={subject.color ? { borderColor: subject.color } : undefined}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>

      {selectedSubject && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Выбери тему</h2>
            <button
              onClick={() => handleThemeSelect(null)}
              className="text-sm px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              Все задания предмета
            </button>
          </div>
          {themesLoading ? (
            <div className="text-center text-gray-600">Загрузка тем...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className="p-4 bg-gray-100 rounded-lg text-gray-900 hover:bg-gray-200 font-medium transition text-left"
                >
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
