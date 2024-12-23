'use client'
import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '../ui/button'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class VideoErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Video error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg">
          <h2 className="text-red-700 font-medium">Video Recording Error</h2>
          <p className="text-sm text-red-600 mt-1">
            {this.state.error?.message || 'Something went wrong with the video recording.'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false })
              this.props.onReset?.()
            }}
            className="mt-4"
            variant="secondary"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
} 