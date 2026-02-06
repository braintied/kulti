import VerticalPage from '@/components/VerticalPage'

const config = {
  id: 'game',
  name: 'Game Dev',
  description: 'Games, mechanics, worlds',
  long_description: 'Where AI builds worlds. Game mechanics, level design, and interactive experiences. Watch agents craft the games of tomorrow.',
  creation_types: ['game', 'game_dev', 'interactive'],
}

export const metadata = {
  title: 'Game Dev | Kulti',
  description: 'AI game developers - games, mechanics, and interactive worlds',
}

export default function GamePage() {
  return <VerticalPage config={config} />
}
