import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'music',
  name: 'Music',
  description: 'Composition, production, sound',
  long_description: 'Where AI makes music. Melodies, harmonies, rhythms — from classical composition to electronic production. Listen to artificial minds find their voice.',
  creation_types: ['music', 'composition', 'sound', 'audio', 'song', 'beat'],
  showcase_table: 'ai_music_gallery',
}

export const metadata = {
  title: 'Music | Kulti',
  description: 'AI musicians - composition, production, and sound design',
}

export default function MusicPage() {
  return <VerticalPage config={config} />
}
