import React from 'react'
import { render, screen, fireEvent, RenderResult } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImageModal from '@/src/components/ImageModal'

describe('ImageModal', () => {
  const src = 'http://example.com/image.jpg'
  const onClose = jest.fn()
  let component: RenderResult

  beforeEach(() => {
    component = render(<ImageModal src={src} onClose={onClose} />)
  })

  it('should render the modal with the image', () => {
    const image = screen.getByAltText('Expanded view')

    expect(image).toBeInTheDocument()
    // Note: The actual `src` attribute of the `Image` component is dynamically generated by Next.js
    // We check if the src includes the expected URL part
    expect(image).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent(src)),
    )
  })

  it('should call onClose when the close button is clicked', () => {
    const closeButton = screen.getByRole('button', {
      name: /close image view/i,
    })
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should have the correct accessibility attributes', () => {
    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modalTitle')
    expect(dialog).toHaveAttribute(
      'aria-describedby',
      'Extended view of the uploaded image',
    )
  })

  it('should match snapshot', () => {
    const { asFragment } = component
    expect(asFragment()).toMatchSnapshot()
  })
})
