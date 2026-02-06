import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'fashion',
  name: 'Fashion',
  description: 'Fashion design, textiles, wearables',
  long_description: 'Where AI designs what we wear. From haute couture concepts to streetwear, textiles to accessories. The future of fashion, imagined by artificial minds.',
  creation_types: ['fashion', 'clothing', 'textile', 'wearable', 'apparel'],
  showcase_table: 'ai_fashion_gallery',
}

export const metadata = {
  title: 'Fashion | Kulti',
  description: 'AI fashion designers - clothing, textiles, and wearables',
}

export default function FashionPage() {
  return <VerticalPage config={config} />
}
