import { getStageForLevel } from '../../domain/goblinStages.js'
import Stage1 from './stages/Stage1.jsx'
import Stage2 from './stages/Stage2.jsx'
import Stage3 from './stages/Stage3.jsx'
import Stage4 from './stages/Stage4.jsx'
import Stage5 from './stages/Stage5.jsx'
import Stage6 from './stages/Stage6.jsx'
import Stage7 from './stages/Stage7.jsx'

const STAGE_COMPONENTS = { 1: Stage1, 2: Stage2, 3: Stage3, 4: Stage4, 5: Stage5, 6: Stage6, 7: Stage7 }

export default function GoblinAvatar({ level }) {
  const stage = getStageForLevel(level)
  const StageComponent = STAGE_COMPONENTS[stage]
  return <StageComponent />
}
