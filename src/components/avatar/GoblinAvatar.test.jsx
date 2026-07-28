import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GoblinAvatar from './GoblinAvatar.jsx'

describe('GoblinAvatar', () => {
  it.each([
    [1, 'goblin-stage-1'], [4, 'goblin-stage-1'],
    [5, 'goblin-stage-2'], [10, 'goblin-stage-3'],
    [15, 'goblin-stage-4'], [20, 'goblin-stage-5'],
    [25, 'goblin-stage-6'], [30, 'goblin-stage-7'], [99, 'goblin-stage-7'],
  ])('renders the correct stage for level %i', (level, testId) => {
    render(<GoblinAvatar level={level} />)
    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })
})
