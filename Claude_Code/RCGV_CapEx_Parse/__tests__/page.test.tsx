import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Page from '@/app/page'

// Mock fetch globally
global.fetch = jest.fn()

describe('PDF Parser Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the upload form', () => {
    render(<Page />)

    expect(screen.getByText('RCGV CapEx PDF Parser')).toBeInTheDocument()
    expect(screen.getByLabelText(/pdf files/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /parse pdfs/i })).toBeInTheDocument()
  })

  it('shows validation error when NP ID is empty', async () => {
    render(<Page />)

    const submitButton = screen.getByRole('button', { name: /parse pdfs/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter np id/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when no files are selected', async () => {
    render(<Page />)

    const npIdInput = screen.getByPlaceholderText(/enter np id/i)
    fireEvent.change(npIdInput, { target: { value: 'NP123' } })

    const submitButton = screen.getByRole('button', { name: /parse pdfs/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please select at least one pdf file/i)).toBeInTheDocument()
    })
  })

  it('displays file count when files are selected', () => {
    render(<Page />)

    const fileInput = screen.getByLabelText(/pdf files/i) as HTMLInputElement
    const file1 = new File(['pdf content 1'], 'test1.pdf', { type: 'application/pdf' })
    const file2 = new File(['pdf content 2'], 'test2.pdf', { type: 'application/pdf' })

    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      configurable: true,
    })

    fireEvent.change(fileInput)

    expect(screen.getByText(/2 files selected/i)).toBeInTheDocument()
  })

  it('disables submit button during processing', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['csv data'])),
      }), 100))
    )

    render(<Page />)

    const npIdInput = screen.getByPlaceholderText(/enter np id/i)
    fireEvent.change(npIdInput, { target: { value: 'NP123' } })

    const fileInput = screen.getByLabelText(/pdf files/i) as HTMLInputElement
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    })

    fireEvent.change(fileInput)

    const submitButton = screen.getByRole('button', { name: /parse pdfs/i })
    fireEvent.click(submitButton)

    // Button should be disabled during processing
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    }, { timeout: 2000 })
  })
})
