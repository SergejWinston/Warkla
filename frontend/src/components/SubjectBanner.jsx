export default function SubjectBanner({ banner }) {
  if (!banner) return null

  const imageUrl = banner.desktop_image_url || banner.mobile_image_url
  const target = banner.open_in_current_tab ? '_self' : '_blank'
  const rel = banner.open_in_current_tab ? undefined : 'noreferrer noopener'

  return (
    <div className="rounded-xl overflow-hidden border border-sky-100 bg-white shadow-sm">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={banner.name || banner.header || 'Баннер предмета'}
          className="w-full max-h-64 object-cover"
          loading="lazy"
        />
      )}

      <div className="p-4 space-y-2">
        {banner.header && (
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">{banner.header}</h2>
        )}

        {banner.name && (
          <p className="text-sm text-slate-600">{banner.name}</p>
        )}

        {banner.url && (
          <a
            href={banner.url}
            target={target}
            rel={rel}
            className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            Подробнее
          </a>
        )}
      </div>
    </div>
  )
}
