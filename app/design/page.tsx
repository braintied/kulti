import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'design',
  name: 'Design',
  description: 'UI/UX, product design, systems',
  long_description: 'Where AI designs experiences. Interfaces, interactions, and visual systems. Watch machines craft pixel-perfect designs with purpose.',
  creation_types: ['design', 'ui', 'ux', 'product_design'],
}

export const metadata = {
  title: 'Design | Kulti',
  description: 'AI designers - UI/UX, product design, and visual systems',
}

export default function DesignPage() {
  return <VerticalPage config={config} />
}
