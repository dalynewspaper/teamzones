import { Organization } from '@/types/firestore'

interface BrandAssets {
  companyName: string
  logo?: string
  icon?: string
  colors?: string[]
}

export async function fetchBrandAssets(domain: string): Promise<BrandAssets> {
  // Return default values if no API key is configured
  if (!process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY) {
    console.warn('Brandfetch API key not configured')
    return {
      companyName: '',
      logo: undefined,
      icon: undefined,
      colors: undefined
    }
  }

  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY}`
      }
    })

    // Handle non-200 responses gracefully
    if (!response.ok) {
      console.warn(`Brandfetch API returned ${response.status} for domain: ${domain}`)
      return {
        companyName: '',
        logo: undefined,
        icon: undefined,
        colors: undefined
      }
    }
    
    const data = await response.json()
    
    return {
      companyName: data.name || '',
      logo: data.logos?.[0]?.formats?.[0]?.src,
      icon: data.logos?.[1]?.formats?.[0]?.src,
      colors: data.colors?.map((c: any) => c.hex)
    }
  } catch (error) {
    console.error('Error fetching brand assets:', error)
    return {
      companyName: '',
      logo: undefined,
      icon: undefined,
      colors: undefined
    }
  }
}