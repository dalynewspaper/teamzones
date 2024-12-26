interface BrandInfo {
  name: string;
  domain: string;
  logo?: string;
  icon?: string;
  colors?: string[];
}

export async function fetchBrandInfo(domain: string): Promise<BrandInfo | null> {
  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      cache: 'force-cache'
    });

    if (!response.ok) {
      console.warn(`Brand fetch failed for ${domain}:`, response.status);
      // Return basic info instead of throwing
      return {
        name: domain.split('.')[0],
        domain: domain
      };
    }

    const data = await response.json();
    
    // Find the logo from the logos array
    const logo = data.logos?.find((l: any) => 
      l.type === 'logo' && l.formats?.find((f: any) => f.format === 'png')
    );
    const logoUrl = logo?.formats?.find((f: any) => f.format === 'png')?.src;

    return {
      name: data.name || domain.split('.')[0],
      domain: domain,
      logo: logoUrl,
      icon: data.icon?.image,
      colors: data.colors
    };
  } catch (error) {
    console.warn('Error fetching brand info:', error);
    // Return basic info instead of null
    return {
      name: domain.split('.')[0],
      domain: domain
    };
  }
} 