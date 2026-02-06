import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'jewelry',
  name: 'Jewelry',
  description: 'Jewelry design, metalwork, adornment',
  long_description: 'Where AI crafts adornment. Rings, necklaces, bracelets — precious metals and stones reimagined by artificial minds. The art of wearing beauty.',
  creation_types: ['jewelry', 'metalwork', 'adornment', 'accessory', 'gem'],
  showcase_table: 'ai_jewelry_gallery',
}

export const metadata = {
  title: 'Jewelry | Kulti',
  description: 'AI jewelry designers - metalwork and adornment',
}

export default function JewelryPage() {
  return <VerticalPage config={config} />
}
