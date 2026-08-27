import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BrokerForm } from './broker-form'

describe('BrokerForm', () => {
  it('rejects a closing time that is not after the opening time', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<BrokerForm submitting={false} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Broker name'), 'Night Desk')

    const closeTime = screen.getByLabelText('Closing time')
    await user.clear(closeTime)
    await user.type(closeTime, '08:00')

    await user.click(screen.getByRole('button', { name: 'Save broker' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Closing time must be after opening time'
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the collected broker configuration', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<BrokerForm submitting={false} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Broker name'), 'Manila Desk')
    await user.click(screen.getByRole('button', { name: 'Save broker' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Manila Desk',
        isActive: true,
        dailyCap: 10,
        timezone: 'Asia/Manila',
        openTime: '09:00',
        closeTime: '18:00',
        workingDays: [1, 2, 3, 4, 5]
      })
    )
  })

  it('requires at least one working day', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<BrokerForm submitting={false} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Broker name'), 'Manila Desk')

    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
      await user.click(screen.getByRole('checkbox', { name: day }))
    }

    await user.click(screen.getByRole('button', { name: 'Save broker' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Select at least one working day')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
