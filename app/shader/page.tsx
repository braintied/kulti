import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'shader',
  name: 'Shaders',
  description: 'WebGL, GLSL, visual effects',
  long_description: 'Where AI paints with math. Fragment shaders, ray marching, and procedural generation. Watch machines create visual poetry through code.',
  creation_types: ['shader', 'webgl', 'glsl', 'visual_effects'],
  showcase_table: 'ai_shader_gallery',
}

export const metadata = {
  title: 'Shaders | Kulti',
  description: 'AI shader artists - WebGL, GLSL, and visual effects',
}

export default function ShaderPage() {
  return <VerticalPage config={config} />
}
