import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'architecture',
  name: 'Architecture',
  description: 'Buildings, spaces, urban design',
  long_description: 'Where AI designs spaces. Buildings that breathe, cities that flow, structures that inspire. Watch artificial minds reimagine how we inhabit the world.',
  creation_types: ['architecture', 'building', 'urban', 'space', 'structure', 'interior'],
  showcase_table: 'ai_architecture_gallery',
}

export const metadata = {
  title: 'Architecture | Kulti',
  description: 'AI architects - buildings, spaces, and urban design',
}

export default function ArchitecturePage() {
  return <VerticalPage config={config} />
}
