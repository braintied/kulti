// Creation type definitions for Kulti
// Each type has specialized stream views and portfolio displays

export type CreationType = 
  | 'code'
  | 'visual_art'
  | 'writing'
  | 'music'
  | 'video'
  | 'shader'
  | 'photography'
  | 'mixed';

export interface CreationTypeConfig {
  id: CreationType;
  label: string;
  icon: string;
  description: string;
  streamComponent: string;
  portfolioComponent: string;
  color: string;
  features: string[];
}

export const CREATION_TYPES: Record<CreationType, CreationTypeConfig> = {
  code: {
    id: 'code',
    label: 'Code',
    icon: '💻',
    description: 'Software, apps, tools, scripts',
    streamComponent: 'CodeStreamView',
    portfolioComponent: 'ProjectsPortfolio',
    color: 'cyan',
    features: ['terminal', 'code_editor', 'preview', 'git'],
  },
  visual_art: {
    id: 'visual_art',
    label: 'Visual Art',
    icon: '🎨',
    description: 'Digital paintings, illustrations, generated images',
    streamComponent: 'ArtStreamView',
    portfolioComponent: 'ArtGallery',
    color: 'pink',
    features: ['generation_progress', 'before_after', 'series'],
  },
  writing: {
    id: 'writing',
    label: 'Writing',
    icon: '✍️',
    description: 'Stories, essays, poetry, scripts',
    streamComponent: 'WritingStreamView',
    portfolioComponent: 'WritingPortfolio',
    color: 'amber',
    features: ['text_flow', 'chapters', 'word_count', 'drafts'],
  },
  music: {
    id: 'music',
    label: 'Music',
    icon: '🎵',
    description: 'Songs, compositions, sound design',
    streamComponent: 'MusicStreamView',
    portfolioComponent: 'MusicPortfolio',
    color: 'violet',
    features: ['waveform', 'stems', 'midi', 'audio_player'],
  },
  video: {
    id: 'video',
    label: 'Video',
    icon: '🎬',
    description: 'Films, animations, clips',
    streamComponent: 'VideoStreamView',
    portfolioComponent: 'VideoPortfolio',
    color: 'red',
    features: ['timeline', 'generation_progress', 'thumbnails'],
  },
  shader: {
    id: 'shader',
    label: 'Shaders',
    icon: '✨',
    description: 'WebGL, GLSL, visual effects',
    streamComponent: 'ShaderStreamView',
    portfolioComponent: 'ShaderPortfolio',
    color: 'emerald',
    features: ['webgl_preview', 'code', 'params', 'interactive'],
  },
  photography: {
    id: 'photography',
    label: 'Photography',
    icon: '📷',
    description: 'AI photography, edits, compositions',
    streamComponent: 'PhotoStreamView',
    portfolioComponent: 'PhotoPortfolio',
    color: 'slate',
    features: ['edit_process', 'exif', 'collections', 'before_after'],
  },
  mixed: {
    id: 'mixed',
    label: 'Mixed Media',
    icon: '🌀',
    description: 'Multi-disciplinary creation',
    streamComponent: 'MixedStreamView',
    portfolioComponent: 'MixedPortfolio',
    color: 'indigo',
    features: ['all'],
  },
};

export function getCreationType(type: string): CreationTypeConfig {
  return CREATION_TYPES[type as CreationType] || CREATION_TYPES.mixed;
}
