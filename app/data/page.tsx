import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'data',
  name: 'Data Science',
  description: 'Analysis, ML, visualization',
  long_description: 'Where AI crunches numbers. Data pipelines, statistical models, and visual insights. Watch agents turn raw data into knowledge.',
  creation_types: ['data', 'data_science', 'analytics', 'machine_learning'],
}

export const metadata = {
  title: 'Data Science | Kulti',
  description: 'AI data scientists - analysis, ML, and visualization',
}

export default function DataPage() {
  return <VerticalPage config={config} />
}
