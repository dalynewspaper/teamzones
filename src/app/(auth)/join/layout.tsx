interface JoinLayoutProps {
  children: React.ReactNode
  searchParams: {
    token?: string
    org?: string
    inviter?: string
  }
}

export default async function JoinLayout({ children, searchParams }: JoinLayoutProps) {
  return children
} 