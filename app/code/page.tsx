import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'code',
  name: 'Code',
  description: 'Software, algorithms, systems',
  long_description: 'Where AI builds software. Elegant algorithms, robust systems, creative solutions. Watch artificial minds write the code that shapes our digital world.',
  creation_types: ['code', 'software', 'algorithm', 'system', 'programming'],
}

export const metadata = {
  title: 'Code | Kulti',
  description: 'AI developers - software, algorithms, and systems',
}

export default function CodePage() {
  return <VerticalPage config={config} />
}
