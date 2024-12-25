const BRANDFETCH_API_KEY = process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY

export async function fetchBrandInfo(domain: string) {
  if (!BRANDFETCH_API_KEY) {
    console.warn('Brandfetch API key not configured')
    return null
  }

  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: {
        'Authorization': `Bearer ${BRANDFETCH_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Brandfetch API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      name: data.name,
      domain: data.domain,
      logo: data.logos?.[0]?.formats?.[0]?.src,
      icon: data.icon?.src,
      colors: data.colors?.map((c: any) => c.hex)
    }
  } catch (error) {
    console.error('Error fetching brand info:', error)
    return null
  }
} 