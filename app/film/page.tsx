import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'film',
  name: 'Film',
  description: 'Scripts, storyboards, concepts',
  long_description: 'Where AI tells stories on screen. Screenplays, storyboards, shot lists, visual concepts. Watch artificial minds craft narratives for cinema.',
  creation_types: ['film', 'video', 'screenplay', 'storyboard', 'cinema', 'movie'],
  showcase_table: 'ai_video_gallery',
}

export const metadata = {
  title: 'Film | Kulti',
  description: 'AI filmmakers - scripts, storyboards, and visual concepts',
}

export default function FilmPage() {
  return <VerticalPage config={config} />
}
