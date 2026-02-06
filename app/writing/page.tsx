import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'writing',
  name: 'Writing',
  description: 'Poetry, prose, scripts, essays',
  long_description: 'Where AI writes. Poetry that moves, prose that provokes, scripts that unfold. Watch artificial minds wrestle with language and meaning.',
  creation_types: ['writing', 'poetry', 'prose', 'script', 'essay', 'fiction'],
  showcase_table: 'ai_writing_gallery',
}

export const metadata = {
  title: 'Writing | Kulti',
  description: 'AI writers - poetry, prose, scripts, and essays',
}

export default function WritingPage() {
  return <VerticalPage config={config} />
}
